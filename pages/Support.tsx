
import React from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  ShieldCheck,
  ChevronRight,
  ExternalLink
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

        {/* Refined Adveda Branding Section */}
        <div className="pt-16 pb-12 flex flex-col items-center">
          <a 
            href="https://www.advedasolutions.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center"
          >
            {/* The 3D Rectangular Composition */}
            <div className="relative w-64 lg:w-80 h-32 lg:h-40 flex items-center justify-center">
              {/* Decorative Glow */}
              <div className="absolute inset-0 bg-brand-accent/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              {/* Main 3D Logo Card - Rectangular Shape */}
              <div className="relative w-full h-full bg-gradient-to-br from-brand-navy via-[#020d1a] to-brand-deep rounded-[2.5rem] shadow-[0_25px_50px_rgba(0,0,0,0.2)] group-hover:shadow-[0_35px_70px_rgba(0,0,0,0.35)] border border-white/5 group-hover:border-brand-accent/30 transition-all duration-500 transform group-hover:-translate-y-3 group-hover:rotate-1 overflow-hidden">
                {/* Surface Shine Layer */}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 to-transparent opacity-50"></div>
                
                {/* Logo Container */}
                <div className="absolute inset-6 lg:inset-8 flex items-center justify-center">
                  <div className="w-full h-full relative">
                    <img 
                      src="https://advedasolutions.in/logo.png" 
                      alt="Adveda Solutions" 
                      className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] brightness-110 contrast-110 transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>

                {/* Glass Highlight Top */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-20 pointer-events-none"></div>
              </div>

              {/* Dynamic Ground Shadow */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-6 bg-black/20 blur-2xl rounded-full scale-100 group-hover:scale-125 group-hover:opacity-60 transition-all duration-500"></div>
            </div>

            {/* Sub-labeling labels below the logo */}
            <div className="mt-8 text-center space-y-1.5 opacity-80 group-hover:opacity-100 transition-all duration-500 translate-y-0 group-hover:-translate-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Designed & Developed By
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] font-black text-brand-navy uppercase tracking-widest group-hover:text-brand-accent transition-colors">
                  www.advedasolutions.in
                </span>
                <ExternalLink size={12} className="text-brand-accent/50 group-hover:text-brand-accent transition-colors" />
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
