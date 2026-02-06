import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Gavel, Camera, MessageSquare, AlertTriangle, CheckCircle, FolderOpen, Download, X } from "lucide-react";
import { EditableText } from "@/components/editable-text";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Case templates data
const caseTemplates = [
  {
    id: "maintenance-delay",
    title: "Maintenance Request Delay",
    description: "For situations where repairs weren't completed in reasonable time",
    steps: [
      "Document the original request date and method",
      "Log each follow-up communication",
      "Take photos showing the condition over time",
      "Record any impacts on habitability"
    ]
  },
  {
    id: "security-deposit",
    title: "Security Deposit Dispute",
    description: "When landlord withholds deposit improperly or charges excessive deductions",
    steps: [
      "Gather move-in and move-out photos",
      "Collect copy of move-in checklist",
      "Document all itemized deductions claimed",
      "Review state laws on deposit return timeline"
    ]
  },
  {
    id: "habitability",
    title: "Habitability Issue",
    description: "For serious problems like mold, pests, no hot water, or heating failures",
    steps: [
      "Document the issue with photos and videos",
      "Log dates when problem started and was reported",
      "Track landlord response or lack thereof",
      "Note any health impacts on residents"
    ]
  },
  {
    id: "lease-violation",
    title: "Landlord Lease Violation",
    description: "When landlord breaks terms of your rental agreement",
    steps: [
      "Identify specific lease clause being violated",
      "Gather evidence of the violation",
      "Document timeline of incidents",
      "Send formal written notice of violation"
    ]
  },
  {
    id: "illegal-entry",
    title: "Illegal Entry / Privacy Violation",
    description: "When landlord enters without proper notice or permission",
    steps: [
      "Document date and time of each entry",
      "Note witnesses if any were present",
      "Review lease and state law notice requirements",
      "Send written notice demanding lawful entry procedures"
    ]
  },
  {
    id: "retaliation",
    title: "Retaliation Claim",
    description: "When landlord retaliates for exercising tenant rights",
    steps: [
      "Document the protected activity (complaint, repair request)",
      "Log retaliatory actions (rent increase, eviction notice)",
      "Note timeline between protected activity and retaliation",
      "Gather witness statements if available"
    ]
  }
];

export default function Resources() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof caseTemplates[0] | null>(null);
  const resources = [
    {
      title: "Document Maintenance",
      description: "How to properly log maintenance issues so they hold up in court.",
      icon: Gavel,
      category: "Guide",
      items: [
        "Take photos immediately when an issue arises",
        "Use a timestamp app for all photos",
        "Submit requests in writing (email or portal), never just phone calls",
        "Keep a log of all interactions with dates and times"
      ]
    },
    {
      title: "Communication Log",
      description: "Templates and best practices for talking to property managers.",
      icon: MessageSquare,
      category: "Template",
      items: [
        "First Notice of Repair Needed",
        "Follow-up on Unanswered Request (48hrs)",
        "Notice of Intent to Withhold Rent (Consult Lawyer First)",
        "Security Deposit Dispute Letter"
      ]
    },
    {
      title: "Evidence Collection",
      description: "What counts as proof? Ensure you have what you need.",
      icon: Camera,
      category: "Checklist",
      items: [
        "Move-in/Move-out Inspection Report",
        "Copies of all lease agreements",
        "Screenshots of text messages",
        "Receipts for any repairs you paid for yourself"
      ]
    },
    {
      title: "Red Flags",
      description: "Warning signs that your landlord might be acting illegally.",
      icon: AlertTriangle,
      category: "Education",
      items: [
        "Asking for cash-only payments",
        "Refusing to provide receipts",
        "Entering without 24-hour notice (except emergencies)",
        "Retaliation threats for requesting repairs"
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col items-center mb-16 space-y-6">
        <EditableText
          contentKey="resources-title"
          defaultValue="Renter Resources"
          as="h1"
          className="text-3xl md:text-5xl font-extrabold text-slate-900"
        />
        <EditableText
          contentKey="resources-subtitle"
          defaultValue="Knowledge is power. Use these guides to maintain perfect records and protect your tenancy."
          as="p"
          className="text-xl text-slate-600 max-w-2xl text-center"
        />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {resources.map((res, i) => (
          <Card key={i} className="glass-card hover:shadow-lg transition-all duration-300 border-slate-200">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <div className="bg-slate-100 p-3 rounded-lg">
                  <res.icon className="w-6 h-6 text-slate-700" />
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                  {res.category}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">{res.title}</CardTitle>
              <CardDescription className="text-slate-500 text-base">{res.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {res.items.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-600 items-start">
                    <CheckCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full mt-6 border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-600">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Case Templates Section */}
      <div className="mt-16">
        <div className="flex flex-col items-center mb-8 space-y-4">
          <EditableText
            contentKey="templates-title"
            defaultValue="Case Templates"
            as="h2"
            className="text-2xl md:text-3xl font-bold text-slate-900"
          />
          <EditableText
            contentKey="templates-subtitle"
            defaultValue="Pre-built case structures to help you document common tenant issues effectively."
            as="p"
            className="text-lg text-slate-600 max-w-xl text-center"
          />
        </div>
        
        <Card className="glass-card hover:shadow-lg transition-all duration-300 border-slate-200 max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FolderOpen className="w-6 h-6 text-blue-700" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                Templates
              </Badge>
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">Pre-built Case Templates</CardTitle>
            <CardDescription className="text-slate-500 text-base">
              Start documenting your case with guided templates for common tenant issues.
              Each template includes step-by-step guidance and evidence checklists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {caseTemplates.slice(0, 4).map((template, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate">{template.title}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm text-slate-500 col-span-2">
                <span className="text-blue-600 font-medium">+ {caseTemplates.length - 4} more templates</span>
              </div>
            </div>
            <Button 
              variant="default" 
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (!user) {
                  navigate("/auth");
                } else {
                  setShowTemplates(true);
                }
              }}
              data-testid="button-view-templates"
            >
              <FileText className="w-4 h-4 mr-2" />
              {user ? "View All Templates" : "Sign In to View Templates"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="w-[90%] max-w-2xl rounded-xl max-h-[80vh] overflow-y-auto" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Case Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {caseTemplates.map((template) => (
              <div 
                key={template.id}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setSelectedTemplate(template)}
                data-testid={`template-${template.id}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{template.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowTemplates(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Detail Dialog */}
      <Dialog open={selectedTemplate !== null} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="w-[90%] max-w-lg rounded-xl" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedTemplate?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-slate-600 mb-4">{selectedTemplate?.description}</p>
            <h4 className="font-semibold text-slate-900 mb-3">Steps to Document:</h4>
            <ul className="space-y-2">
              {selectedTemplate?.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-slate-600 items-start">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 mt-6">
            <Button 
              variant="default" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                // Navigate to dashboard to create new case with this template
                navigate("/dashboard?template=" + selectedTemplate?.id);
              }}
            >
              Start New Case
            </Button>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
