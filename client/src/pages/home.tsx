import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Shield, LogIn, UserPlus } from "lucide-react";
import { EditableText } from "@/components/editable-text";

const companyData: Record<string, {
  letterRating: string;
  stars: string;
  complaints: string;
  issue: string;
  url: string;
}> = {
  amh: {
    letterRating: "A+ (View Profile)", 
    stars: "1.12 / 5",
    complaints: "719+",
    issue: "Maintenance Negligence & Repairs",
    url: "https://www.bbb.org/us/nv/las-vegas/profile/property-management/american-homes-4-rent-1086-90016239"
  },
  invitation: {
    letterRating: "NR (View Profile)",
    stars: "1.24 / 5", 
    complaints: "1,800+",
    issue: "Undisclosed Fees (FTC Action)",
    url: "https://www.bbb.org/us/tx/dallas/profile/real-estate-rentals/invitation-homes-0875-90466743"
  },
  progress: {
    letterRating: "A+ (View Profile)",
    stars: "1.10 / 5",
    complaints: "1,776+",
    issue: "Unresponsive Maintenance",
    url: "https://www.bbb.org/us/az/scottsdale/profile/real-estate-rentals/progress-residential-property-manager-llc-1126-1000037420"
  },
  msr: {
    letterRating: "NR (View Profile)",
    stars: "1.80 / 5",
    complaints: "1,716+",
    issue: "Habitability & Mold",
    url: "https://www.bbb.org/us/tx/austin/profile/property-management/main-street-renewal-llc-0825-1000101775"
  }
};

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const data = selectedCompany ? companyData[selectedCompany] : null;

  const handleStartDocumentation = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthChoice = (mode: "login" | "register") => {
    setShowAuthModal(false);
    navigate(`/auth?mode=${mode}`);
  };

  return (
    <>
    <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 bg-slate-100 p-3 rounded-full">
            <Shield className="w-8 h-8 text-slate-700" />
          </div>
          <DialogTitle className="text-center text-xl">Create an Account to Start Documenting</DialogTitle>
          <DialogDescription className="text-center text-slate-600 pt-2">
            Your evidence is securely stored and accessible only to you. Build your case with confidence.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            className="w-full h-12 btn-gradient text-white font-semibold"
            onClick={() => handleAuthChoice("register")}
            data-testid="btn-modal-register"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Create Account
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 font-semibold border-slate-300"
            onClick={() => handleAuthChoice("login")}
            data-testid="btn-modal-login"
          >
            <LogIn className="w-5 h-5 mr-2" />
            I Already Have an Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <div className="flex flex-col items-center justify-center pt-16 pb-16 px-4 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-[850px] mx-auto"
      >
        <EditableText
          contentKey="hero-title"
          defaultValue="Turn Evidence Into Action."
          as="h1"
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-10 text-gradient leading-[1.2]"
        />
        
        <EditableText
          contentKey="hero-description"
          defaultValue="The comprehensive toolkit for tenants of America's largest corporate landlords. Document health hazards, track maintenance negligence, and protect your rights."
          as="p"
          className="text-xl text-slate-600 mb-14 max-w-[600px] mx-auto font-normal leading-relaxed"
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass-card p-6 md:p-12 rounded-2xl w-full max-w-[580px] text-left relative z-20"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 pl-[6px] pr-[6px]">
              Select Your Property Manager
            </Label>
            <Select onValueChange={setSelectedCompany}>
              <SelectTrigger className="h-14 text-lg bg-white border-slate-300 focus:ring-slate-400" data-testid="select-company">
                <SelectValue placeholder="Choose a company..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amh">American Homes 4 Rent (AMH)</SelectItem>
                <SelectItem value="invitation">Invitation Homes</SelectItem>
                <SelectItem value="progress">Progress Residential</SelectItem>
                <SelectItem value="msr">Main Street Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="pt-8 mt-4 border-t border-slate-200"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <span className="font-medium text-slate-600 text-[0.95rem]">BBB Accreditation</span>
                  <a 
                    href={data.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold text-slate-900 underline decoration-slate-400 decoration-1 underline-offset-4 hover:text-slate-600"
                  >
                    {data.letterRating}
                  </a>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-medium text-slate-600 text-[0.95rem]">Customer Rating</span>
                  <span className="font-bold text-red-800 bg-red-50 px-2 py-1 rounded border border-red-200 text-[0.95rem]">
                    {data.stars}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-medium text-slate-600 text-[0.95rem]">#1 Complaint Category</span>
                  <span className="font-semibold text-slate-900 text-right text-[1.05rem]">{data.issue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-600 text-[0.95rem]">Total Complaints (3 Yrs)</span>
                  <span className="font-semibold text-slate-900 text-[1.05rem]">{data.complaints}</span>
                </div>
              </div>
            </motion.div>
          )}

          <Button 
            className="w-full h-14 text-lg font-semibold btn-gradient shadow-lg mt-8 rounded-lg"
            onClick={handleStartDocumentation}
            data-testid="btn-start-documentation"
          >
            Start Documentation
          </Button>
        </div>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full text-left">
        <div className="p-6 rounded-xl bg-white/50 border border-slate-200/60 backdrop-blur-sm">
          <EditableText
            contentKey="feature-1-title"
            defaultValue="Document"
            as="h3"
            className="font-bold text-slate-900 mb-2"
          />
          <EditableText
            contentKey="feature-1-desc"
            defaultValue="Log every interaction, photo, and maintenance request in a secure timeline."
            as="p"
            className="text-slate-600 text-sm leading-relaxed"
          />
        </div>
        <div className="p-6 rounded-xl bg-white/50 border border-slate-200/60 backdrop-blur-sm">
          <EditableText
            contentKey="feature-2-title"
            defaultValue="Diagnose"
            as="h3"
            className="font-bold text-slate-900 mb-2"
          />
          <EditableText
            contentKey="feature-2-desc"
            defaultValue="Our AI checks your local laws to see exactly which rights are being violated."
            as="p"
            className="text-slate-600 text-sm leading-relaxed"
          />
        </div>
        <div className="p-6 rounded-xl bg-white/50 border border-slate-200/60 backdrop-blur-sm">
          <EditableText
            contentKey="feature-3-title"
            defaultValue="Demand"
            as="h3"
            className="font-bold text-slate-900 mb-2"
          />
          <EditableText
            contentKey="feature-3-desc"
            defaultValue="Auto-generate a formal legal notice that demands action under penalty of law."
            as="p"
            className="text-slate-600 text-sm leading-relaxed"
          />
        </div>
      </div>
    </div>
    </>
  );
}
