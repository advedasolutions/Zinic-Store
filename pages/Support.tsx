
import React from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  Globe
} from 'lucide-react';

export const Support: React.FC = () => {
  const contactData = [
    {
      label: 'Instant Support',
      title: 'WhatsApp Business',
      value: '+91 7972065231',
      link: 'https://wa.me/917972065231',
      icon: <MessageCircle className="text-emerald-500" size={24} />,
      color: 'bg-emerald-50',
      action: 'Open Chat'
    },
    {
      label: 'Technical Helpline',
      title: 'Direct Phone Link',
      value: '+91 7972065231',
      link: 'tel:+917972065231',
      icon: <Phone className="text-brand-navy" size={24} />,
      color: 'bg-blue-50',
      action: 'Call Now'
    },
    {
      label: 'Official Support',
      title: 'Enterprise Email',
      value: 'admin@advedasolutions.in',
      link: 'mailto:admin@advedasolutions.in',
      icon: <Mail className="text-rose-500" size={24} />,
      color: 'bg-rose-50',
      action: 'Send Email'
    }
  ];

  return (
    <div className="min-h-screen lg:min-h-[85vh] flex flex-col items-center justify-start lg:justify-center p-4 md:p-8 animate-fade-in bg-[#f8fafc]">
      <div className="w-full max-w-2xl space-y-12 lg:space-y-16">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-navy text-brand-accent text-[9px] font-black uppercase tracking-widest shadow-lg">
            <ShieldCheck size={12} /> Priority Service Lane
          </div>
          <h1 className="text-3xl lg:text-5xl font-black text-brand-navy tracking-tight uppercase">
            Technical <span className="text-brand-accent">Support.</span>
          </h1>
          <p className="text-slate-400 font-bold text-xs lg:text-sm max-w-sm mx-auto uppercase tracking-wider">
            Enterprise infrastructure assistance for verified administrators.
          </p>
        </div>
        
        {/* Contact Grid */}
        <div className="grid grid-cols-1 gap-4">
          {contactData.map((contact, idx) => (
            <a 
              key={idx} 
              href={contact.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-white p-6 rounded-[2rem] shadow-[0_15px_40px_rgba(0,10,18,0.04)] border border-slate-100 hover:border-brand-accent/50 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-5 lg:gap-8"
            >
              <div className={`w-14 h-14 lg:w-16 lg:h-16 ${contact.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner`}>
                {contact.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">
                  {contact.label}
                </p>
                <p className="font-black text-brand-navy text-lg lg:text-xl truncate tracking-tight break-all">
                  {contact.value}
                </p>
              </div>

              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-300 group-hover:bg-brand-navy group-hover:text-brand-accent transition-all">
                <ArrowRight size={18} />
              </div>
            </a>
          ))}
        </div>

        {/* 3D Branding Section */}
        <div className="pt-20 pb-12 flex flex-col items-center space-y-8">
          <div className="text-center space-y-1">
            <p className="text-[8px] lg:text-[10px] font-black text-slate-300 uppercase tracking-[0.6em] ml-[0.6em]">Core Architecture</p>
            <p className="text-[10px] lg:text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Developed and Designed By</p>
          </div>
          
          <a 
            href="https://www.advedasolutions.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative"
          >
            {/* 3D Layered Background Effect */}
            <div className="absolute inset-0 bg-brand-accent/5 blur-2xl rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            {/* The Main 3D Card */}
            <div className="relative p-6 lg:p-8 bg-white rounded-[2.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 group-hover:border-brand-accent/20 group-hover:-translate-y-2 transition-all duration-500 overflow-hidden">
              {/* Internal Glass Highlight */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none"></div>
              
              {/* Logo with specific sizing for professional look */}
              <div className="relative flex items-center justify-center h-12 lg:h-14">
                <img 
                  src="https://advedasolutions.in/logo.png" 
                  alt="Adveda Solutions" 
                  className="h-full w-auto object-contain transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Floating Label with External Link Icon */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-black text-brand-accent uppercase tracking-tighter">Adveda Solutions</span>
                <ArrowRight size={12} className="text-brand-accent -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Globe size={10} />
                <span className="text-[8px] font-black uppercase tracking-widest">www.advedasolutions.in</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
