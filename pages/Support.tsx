
import React from 'react';
import { MessageCircle, Phone, Mail, ExternalLink, Globe } from 'lucide-react';

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
      label: 'Direct Line',
      value: '+91 7972065231',
      link: 'tel:+917972065231',
      icon: <Phone className="text-brand-navy" size={24} />,
      color: 'bg-blue-50'
    },
    {
      label: 'Support Node Email',
      value: 'admin@advedasolutions.in',
      link: 'mailto:admin@advedasolutions.in',
      icon: <Mail className="text-rose-500" size={24} />,
      color: 'bg-rose-50'
    }
  ];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-xl space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-brand-accent/5 border border-brand-accent/10 text-brand-accent text-[10px] font-black uppercase tracking-widest">
            Level-3 Support Protocol
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-brand-navy tracking-tight uppercase">Help Desk</h1>
          <p className="text-slate-400 font-medium text-sm">Direct communication channels to our core technical engineers.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {contactData.map((contact, idx) => (
            <a 
              key={idx} 
              href={contact.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-white p-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-2xl hover:border-brand-accent transition-all duration-500 flex items-center gap-6"
            >
              <div className={`w-14 h-14 ${contact.color} rounded-[1.25rem] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                {contact.icon}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{contact.label}</p>
                <p className="font-black text-brand-navy text-base lg:text-lg truncate">{contact.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-brand-navy group-hover:text-brand-accent transition-all">
                <ExternalLink size={18} />
              </div>
            </a>
          ))}
        </div>

        <div className="pt-12 flex flex-col items-center text-center space-y-8">
          <div className="flex items-center gap-4 w-full">
            <div className="h-px flex-1 bg-slate-100"></div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Zinic Core Architecture</p>
            <div className="h-px flex-1 bg-slate-100"></div>
          </div>
          
          <div className="flex flex-col items-center space-y-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Designed & Developed by</p>
            
            <a 
              href="https://www.advedasolutions.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-4 hover:scale-105 transition-all duration-500"
            >
              {/* Logo Container for Visibility on light backgrounds */}
              <div className="p-6 bg-brand-navy rounded-[2rem] shadow-2xl border border-white/10 group-hover:shadow-[0_20px_50px_rgba(0,10,18,0.3)] transition-all">
                <img 
                  src="https://advedasolutions.in/logo.png" 
                  alt="Adveda Solutions" 
                  className="h-12 w-auto object-contain brightness-110 group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-sm font-black text-brand-navy tracking-tight group-hover:text-brand-accent transition-colors">ADVEDA SOLUTIONS</span>
                <span className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  <Globe size={10} /> www.advedasolutions.in
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
