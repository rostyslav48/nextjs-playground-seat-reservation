"use client";
import {useActionState} from 'react';
import type {HTMLInputTypeAttribute} from 'react';
import {submit, type SubmissionState} from './actions';
type Field={name:string;label:string;type:string};
export default function SubmissionForm({fields,button,note}:{fields:Field[];button:string;note:string}) {
  const [state,action,pending]=useActionState<SubmissionState,FormData>(submit,{ok:false,message:''});
  return <form className="card" action={action}><h2>{button}</h2>{state.message && <div role={state.ok?'status':'alert'} className={'notice'+(state.ok?'':' error')}>{state.message}</div>}{fields.map(field=><label key={field.name}><span>{field.label}</span><input type={field.type as HTMLInputTypeAttribute} name={field.name} maxLength={300} required/></label>)}<button disabled={pending}>{pending?'Saving…':button}</button><p className="form-note">{note}</p></form>;
}
