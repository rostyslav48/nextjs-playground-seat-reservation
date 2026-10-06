import config from '../src/core/config.js';
import {service} from '../src/core/service.js';
import SubmissionForm from './form';
export const dynamic='force-dynamic';
export default function Page(){
  const model=service().publicView() as {remaining:number};
  return <section className="hero"><div><div className="eyebrow">{config.eyebrow}</div><h1>{config.headline}</h1><p className="intro">{config.description}</p><div className="details">{config.details.map(([key,value])=><div className="detail" key={key}><small>{key}</small><strong>{value}</strong></div>)}</div><p className="count">{model.remaining} of {config.capacity} seats available</p></div><SubmissionForm fields={config.fields} button={config.button} note={config.formNote}/></section>;
}
