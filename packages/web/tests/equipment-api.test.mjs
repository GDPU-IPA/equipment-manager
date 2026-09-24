import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createEquipmentApi, equipmentError } from '../src/api/equipment.ts';
const item = {id:1,name:'测试设备',category_id:2,category:{name:'仪器'},description:null,total_stock:5,available_stock:2,status:1};
function fixture(data, inspect = () => {}) {
  return createEquipmentApi(axios.create({adapter:async config => {
    inspect(config); return {data:{code:200,data},status:200,statusText:'OK',headers:{},config};
  }}));
}
test('list forwards pagination, name, category and abort signal', async () => {
  const signal = new AbortController().signal;
  const params = {page:2,pageSize:12,name:'测试',category_id:2};
  const data = {list:[item],total:13,page:2,pageSize:12};
  assert.deepEqual(await fixture(data,c => {
    assert.equal(c.url,'/equipments'); assert.deepEqual(c.params,params); assert.equal(c.signal,signal);
    assert.equal(c.headers.Authorization,undefined);
  }).list(params,signal),data);
});
test('detail uses numeric id, not local fixture id', async () => {
  assert.deepEqual(await fixture(item,c=>assert.equal(c.url,'/equipments/1')).detail(1),item);
  await assert.rejects(fixture(item).detail(NaN),/编号无效/);
});
test('flat category and empty list accepted', async () => {
  assert.equal((await fixture([{id:2,parent_id:null,name:'仪器'}]).categories()).length,1);
  assert.equal((await fixture({list:[],total:0,page:1,pageSize:12}).list({page:1,pageSize:12})).total,0);
});
test('malformed responses rejected', async () => {
  await assert.rejects(fixture({list:[{id:1}],total:1,page:1,pageSize:12}).list({page:1,pageSize:12}),/格式/);
  await assert.rejects(fixture({children:[]}).categories(),/格式/);
  await assert.rejects(fixture('<html>').detail(1),/格式/);
});
test('authorization errors explained without treating demo login as real', () => {
  assert.match(equipmentError(new axios.AxiosError('Denied','ERR_BAD_REQUEST',undefined,undefined,{status:401})),/真实登录/);
});
