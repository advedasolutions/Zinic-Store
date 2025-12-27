
import React from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  Globe,
  ExternalLink,
  ChevronRight
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
      <div className="w-full max-w-2xl space-y-10 lg:space-y-14">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-navy text-brand-accent text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-navy/10 mb-2">
            <ShieldCheck size={14} /> Priority Support Channel
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-brand-navy tracking-tighter uppercase leading-none">
            Node <span className="text-brand-accent">Assistance.</span>
          </h1>
          <p className="text-slate-400 font-bold text-xs lg:text-sm max-w-md mx-auto uppercase tracking-widest leading-relaxed">
            Enterprise infrastructure assistance for verified platform administrators and client nodes.
          </p>
        </div>
        
        {/* Contact Grid */}
        <div className="grid grid-cols-1 gap-5">
          {contactData.map((contact, idx) => (
            <a 
              key={idx} 
              href={contact.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-white p-6 lg:p-7 rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,10,18,0.03)] border border-slate-100 hover:border-brand-accent/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex items-center gap-5 lg:gap-8"
            >
              <div className={`w-14 h-14 lg:w-16 lg:h-16 ${contact.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner`}>
                {contact.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 group-hover:text-brand-accent transition-colors">
                  {contact.label}
                </p>
                <p className="font-black text-brand-navy text-base lg:text-xl truncate tracking-tight break-all">
                  {contact.value}
                </p>
              </div>

              <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-brand-navy group-hover:text-brand-accent transition-all duration-500">
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>

        {/* Professional 3D Branding Section */}
        <div className="pt-16 pb-12 flex flex-col items-center">
          <div className="mb-10 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em] mb-1">Infrastructure Core</p>
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Developed and Designed By</h2>
          </div>
          
          <a 
            href="https://www.advedasolutions.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center"
          >
            {/* The 3D Composition */}
            <div className="relative w-48 h-48 lg:w-56 lg:h-56 flex items-center justify-center">
              {/* Outer Decorative Rings */}
              <div className="absolute inset-0 border border-slate-100 rounded-[3rem] opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000"></div>
              <div className="absolute inset-4 border border-brand-accent/10 rounded-[2.5rem] opacity-0 group-hover:opacity-100 group-hover:scale-105 group-hover:-rotate-6 transition-all duration-700 delay-75"></div>

              {/* Main 3D Logo Card */}
              <div className="relative w-32 h-32 lg:w-40 lg:h-40 bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)] border border-slate-100 group-hover:border-brand-accent/20 transition-all duration-500 transform group-hover:-translate-y-4 group-hover:rotate-1 overflow-hidden">
                {/* Internal Layering for Depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 to-transparent"></div>
                <div className="absolute inset-[1px] rounded-[2.4rem] bg-white"></div>
                
                {/* Logo Container with specific background to ensure visibility */}
                <div className="absolute inset-6 flex items-center justify-center">
                  <div className="w-full h-full relative">
                    <img 
                      src="https://advedasolutions.in/logo.png" 
                      alt="Adveda Solutions" 
                      className="w-full h-full object-contain filter drop-shadow-sm brightness-100 transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                </div>

                {/* Glass Polish Layer */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent opacity-50 pointer-events-none"></div>
              </div>

              {/* Ground Shadow for 3D Feel */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-brand-navy/5 blur-xl rounded-full scale-150 group-hover:scale-110 group-hover:opacity-50 transition-all duration-500"></div>
            </div>

            {/* Labeling with high visibility */}
            <div className="mt-4 text-center space-y-2 translate-y-0 group-hover:-translate-y-2 transition-transform duration-500">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm lg:text-base font-black text-brand-navy uppercase tracking-tighter group-hover:text-brand-accent transition-colors">Adveda Solutions</span>
                <ExternalLink size={14} className="text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200 shadow-inner group-hover:bg-brand-navy group-hover:border-brand-navy transition-all duration-500">
                <Globe size={10} className="text-slate-400 group-hover:text-brand-accent" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white">www.advedasolutions.in</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
