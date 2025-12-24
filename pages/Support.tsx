import React from 'react';
import { MessageCircle, Phone, Mail, ExternalLink } from 'lucide-react';

export const Support: React.FC = () => {
  const contactData = [
    {
      label: 'Connect on WhatsApp',
      value: '+91 7972065231',
      link: 'https://wa.me/917972065231',
      icon: <MessageCircle className="text-emerald-500" size={24} />,
      color: 'bg-emerald-50'
    },
    {
      label: 'Contact no',
      value: '+91 7972065231',
      link: 'tel:+917972065231',
      icon: <Phone className="text-brand-navy" size={24} />,
      color: 'bg-blue-50'
    },
    {
      label: 'Email id',
      value: 'pratik370001@gmail.com',
      link: 'mailto:pratik370001@gmail.com',
      icon: <Mail className="text-rose-500" size={24} />,
      color: 'bg-rose-50'
    }
  ];

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-black text-brand-navy tracking-tight mb-8 text-center uppercase tracking-widest">Support Channels</h1>
        
        <div className="space-y-3">
          {contactData.map((contact, idx) => (
            <a 
              key={idx} 
              href={contact.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 hover:shadow-2xl hover:border-brand-accent transition-all duration-300 flex items-center gap-5"
            >
              <div className={`w-12 h-12 ${contact.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                {contact.icon}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{contact.label}</p>
                <p className="font-black text-brand-navy text-sm truncate">{contact.value}</p>
              </div>
              <div className="text-slate-200 group-hover:text-brand-accent transition-colors">
                <ExternalLink size={18} />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Zinic Core Support Interface</p>
        </div>
      </div>
    </div>
  );
};