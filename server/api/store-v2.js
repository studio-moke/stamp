import { createStripeCheckoutSession, retrieveStripeCheckoutSession, stripeConfigured } from "./_stripe.js";
import { presignR2Put, r2GetJson, r2Head, r2PutJson } from "./_r2.js";
import { presignStoreDownload } from "./_store-r2.js";
import { getRuntimeDigitalProduct, getRuntimeDigitalProducts, writeRuntimeProductState } from "./_store-products.js";

function json(res,status,value){res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify(value));}
function readBody(req){if(req.body&&typeof req.body==="object")return Promise.resolve(req.body);return new Promise((resolve,reject)=>{let raw="";req.on("data",c=>{raw+=c;if(raw.length>200000)reject(new Error("Request too large"));});req.on("end",()=>{try{resolve(raw?JSON.parse(raw):{});}catch{reject(new Error("Invalid JSON"));}});req.on("error",reject);});}
function isAdmin(req){const expected=process.env.STORE_ADMIN_TOKEN||process.env.FREE_ADMIN_TOKEN;return Boolean(expected&&req.headers["x-admin-token"]===expected);}
function cleanId(v=""){const id=String(v).replace(/[^0-9]/g,"");return id.length>=6&&id.length<=20?id:"";}
function zipKey(id){return `digital-products/${id}/product.zip`;}
function orderKey(id){return `store-orders/${String(id).replace(/[^a-zA-Z0-9_\-]/g,"")}.json`;}
async function persistPaidOrder(session){if(session?.payment_status!=="paid")return null;const product=await getRuntimeDigitalProduct(session?.metadata?.product_id);if(!product?.published||!product.zipKey)return null;const order={sessionId:session.id,productId:product.id,amountTotal:session.amount_total,currency:session.currency,customerEmail:session.customer_details?.email||session.customer_email||"",paidAt:new Date().toISOString()};await r2PutJson(orderKey(session.id),order);return order;}

export default async function handler(req,res){
 try{
  const action=String(req.query?.action||"status");
  if(req.method==="GET"&&action==="status"){const products=await getRuntimeDigitalProducts();return json(res,200,{ok:true,paymentProvider:"stripe",paymentConfigured:stripeConfigured(),priceYen:500,productCount:products.length,publishedCount:products.filter(p=>p?.published).length});}
  if(req.method==="GET"&&action==="catalog"){const products=await getRuntimeDigitalProducts();return json(res,200,{ok:true,products:products.filter(Boolean).map(p=>({id:p.id,published:p.published,assetCount:p.assetCount||0,preparedAt:p.preparedAt||""}))});}
  if(req.method==="POST"&&action==="admin-health"){if(!isAdmin(req))return json(res,401,{ok:false,error:"管理トークンが一致しません。"});return json(res,200,{ok:true,tokenSource:process.env.STORE_ADMIN_TOKEN?"STORE_ADMIN_TOKEN":"FREE_ADMIN_TOKEN",stripeConfigured:stripeConfigured()});}
  if(req.method==="POST"&&action==="admin-upload-url"){
   if(!isAdmin(req))return json(res,401,{ok:false,error:"管理トークンが一致しません。"});const b=await readBody(req);const id=cleanId(b.productId),count=Number(b.assetCount||0);const product=id?await getRuntimeDigitalProduct(id):null;if(!product)return json(res,404,{ok:false,error:"商品が見つかりません。"});if(!Number.isInteger(count)||count<1||count>80)return json(res,400,{ok:false,error:"画像点数が不正です。"});const key=zipKey(id);return json(res,200,{ok:true,key,uploadUrl:presignR2Put(key,900)});
  }
  if(req.method==="POST"&&action==="admin-publish"){
   if(!isAdmin(req))return json(res,401,{ok:false,error:"管理トークンが一致しません。"});const b=await readBody(req);const id=cleanId(b.productId),count=Number(b.assetCount||0);const product=id?await getRuntimeDigitalProduct(id):null;if(!product)return json(res,404,{ok:false,error:"商品が見つかりません。"});if(!Number.isInteger(count)||count<1||count>80)return json(res,400,{ok:false,error:"画像点数が不正です。"});const key=zipKey(id);if(!(await r2Head(key)))return json(res,409,{ok:false,error:"ZIPのアップロードを確認できません。"});const record=await writeRuntimeProductState(id,{zipKey:key,assetCount:count,published:b.published!==false,preparedAt:new Date().toISOString(),licenseVersion:"2026-09-07"});return json(res,200,{ok:true,product:{id,published:record.published,assetCount:record.assetCount,preparedAt:record.preparedAt}});
  }
  if(req.method==="POST"&&action==="admin-unpublish"){
   if(!isAdmin(req))return json(res,401,{ok:false,error:"管理トークンが一致しません。"});const b=await readBody(req);const id=cleanId(b.productId),product=id?await getRuntimeDigitalProduct(id):null;if(!product)return json(res,404,{ok:false,error:"商品が見つかりません。"});await writeRuntimeProductState(id,{published:false,updatedAt:new Date().toISOString()});return json(res,200,{ok:true});
  }
  if(req.method==="POST"&&action==="checkout"){
   const b=await readBody(req),product=await getRuntimeDigitalProduct(b.productId);if(!product)return json(res,404,{ok:false,error:"商品が見つかりません。"});if(!product.published||!product.zipKey)return json(res,409,{ok:false,error:"この商品はまだ販売準備中です。"});if(!stripeConfigured())return json(res,503,{ok:false,error:"決済はまだ有効化されていません。"});const origin=String(process.env.STORE_ORIGIN||"https://stamp-moke.jp").replace(/\/$/,"");const session=await createStripeCheckoutSession({product,origin});return json(res,200,{ok:true,checkoutUrl:session.url});
  }
  if(req.method==="GET"&&action==="download"){
   const sessionId=String(req.query?.session_id||"");if(!sessionId.startsWith("cs_"))return json(res,400,{ok:false,error:"購入情報が確認できません。"});let order=await r2GetJson(orderKey(sessionId),null);if(!order&&stripeConfigured()){const session=await retrieveStripeCheckoutSession(sessionId);order=await persistPaidOrder(session);}if(!order)return json(res,409,{ok:false,pending:true,error:"決済確認中です。少ししてから再度お試しください。"});const product=await getRuntimeDigitalProduct(order.productId);if(!product?.published||!product.zipKey)return json(res,410,{ok:false,error:"ダウンロード商品を確認できません。"});return json(res,200,{ok:true,productId:product.id,title:product.title,downloadUrl:presignStoreDownload(product.zipKey,600),expiresIn:600});
  }
  res.setHeader("Allow","GET, POST");return json(res,405,{ok:false,error:"Method not allowed"});
 }catch(error){console.error("store api v2 error",error);return json(res,500,{ok:false,error:"販売システムでエラーが発生しました。"});}
}
