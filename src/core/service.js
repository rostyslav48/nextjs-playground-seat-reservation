import './env.js';
import { z } from 'zod';
import config from './config.js';
import { openStore } from './store.js';
import { sendMail } from './mail.js';
import { AppError, rateLimit } from './security.js';

const NOTIFICATION_KEY = 'reservation';

const fieldSchema = field => {
  let value = z.string().trim().min(1, `${field.label} is required.`).max(300, `${field.label} is too long.`);
  if (field.type === 'email') value = value.email('Enter a valid email address.').transform(s => s.toLowerCase());
  return value;
};
export const submissionSchema = z.object(Object.fromEntries(config.fields.map(f => [f.name, fieldSchema(f)])));

export function createService({store=openStore(), deliver=sendMail}={}) {
  const {db,records,find,insert,atomic,queue}=store;
  const onSubmit=data=>{
    if(find(data.email))throw new AppError('You already have a reserved seat.',409);
    if(records(config.kind).length>=config.capacity)throw new AppError('This workshop is full.',409);
    const row=insert(config.kind,data,'reserved',data.email);
    queue(row.id,{
      to:[data.email],
      subject:'Your workshop seat is reserved',
      text:`Hello ${data.name},\nYour seat is reserved for October 24, 2026 at 10:00 UTC.\nThe Workshop, Room B. Materials are included.`,
      category:`${config.kind}.${NOTIFICATION_KEY}`,
      customVariables:{record_id:row.id,workflow:config.kind},
      headers:{'X-Workflow-Reference':row.id}
    });
    return row;
  };
  const publicView=()=>({remaining:Math.max(0,config.capacity-records(config.kind).length)});
  let flushing=false;
  async function flush() {
    if(flushing)return; flushing=true;
    const save=(id,result)=>db.prepare('UPDATE outbox SET status=?,provider_id=?,error=? WHERE id=?').run(result.status,result.providerId || '',result.error || null,id);
    try {
      while(true) {
        const candidates=db.prepare("SELECT * FROM outbox WHERE status='pending' ORDER BY created_at LIMIT 20").all();
        if(!candidates.length)break;
        const claimed=[];
        for(const row of candidates) {
          if(db.prepare("UPDATE outbox SET status='sending' WHERE id=? AND status='pending'").run(row.id).changes)claimed.push({...row,message:JSON.parse(row.payload)});
        }
        for(const row of claimed) {
          try {const result=await deliver(row.message); if(!['accepted','logged'].includes(result?.status))throw Object.assign(new Error('Unrecognized send result.'),{uncertain:true});save(row.id,result);}
          catch(error){save(row.id,{status:error.uncertain?'unknown':'failed',error:error.message || 'Sending failed.'});}
        }
      }
    } finally {flushing=false;}
  }
  async function submit(input, identity='local') {
    const parsed=submissionSchema.safeParse(input);
    if(!parsed.success)throw new AppError(parsed.error.issues[0].message);
    const data=parsed.data;
    rateLimit(db,`ip:${identity}`);
    rateLimit(db,`recipient:${data.email}`,3);
    const result=atomic(()=>onSubmit(data));
    await flush();
    let message=config.success;
    const states=db.prepare('SELECT status FROM outbox WHERE dedupe_key=?').all(result.id).map(row=>row.status);
    if(states.some(state=>['failed','unknown','pending','sending'].includes(state)))message+=' The email has not been confirmed as sent yet; the operator can review its status.';
    else if(states.includes('logged'))message+=' The email was recorded locally; no message was sent.';
    return {ok:true,message,id:result.id};
  }
  function adminView() {return {records:records(config.kind),outbox:db.prepare('SELECT id,status,error,created_at FROM outbox ORDER BY created_at DESC LIMIT 30').all()};}
  function retryFailed() {db.prepare("UPDATE outbox SET status='pending',error=NULL WHERE status='failed'").run();return flush();}
  return {store,submit,publicView,adminView,flush,retryFailed};
}
let singleton;
export function service() {return singleton ||= createService();}
