import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Incident, IncidentLog, SEVERITY_LEVELS, SeverityLevel, DEFAULT_SEVERITY_BY_TYPE, getLogSeverity } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, Send, Phone, FileText, Image as ImageIcon, Trash2, Calendar, Clock, Pencil, MessageSquare, Mail, Paperclip, X, FolderOpen, RotateCcw, ChevronDown, ChevronRight, Folder, Copy, Check, Download, FolderUp, AlertTriangle, Info, Minus, Wrench } from "lucide-react";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { GuidedTour, shouldOpenMobileDrawer } from "@/components/guided-tour";
import { ChatInput, type ChatInputHandle } from "@/components/chat-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function IncidentView() {
  const [match, params] = useRoute("/dashboard/incident/:id");
  const id = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const generalFileInputRef = useRef<HTMLInputElement>(null);
  const [highlightedLogId, setHighlightedLogId] = useState<number | null>(null);
  
  // Edit incident state
  const [editIncidentOpen, setEditIncidentOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  // Log dialogs state
  const [logCallOpen, setLogCallOpen] = useState(false);
  const [logTextOpen, setLogTextOpen] = useState(false);
  const [logEmailOpen, setLogEmailOpen] = useState(false);
  const [logServiceOpen, setLogServiceOpen] = useState(false);
  const [logTitle, setLogTitle] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logSeverity, setLogSeverity] = useState<SeverityLevel>('routine');
  const [logPhotoFiles, setLogPhotoFiles] = useState<File[]>([]);
  const [logDocFiles, setLogDocFiles] = useState<File[]>([]);
  
  // Edit log state
  const [editLogId, setEditLogId] = useState<number | null>(null);
  const [editLogContent, setEditLogContent] = useState("");
  const [editLogPhoto, setEditLogPhoto] = useState<IncidentLog | null>(null);
  const [editLogAttachments, setEditLogAttachments] = useState<string[]>([]);
  const [editLogSeverity, setEditLogSeverity] = useState<SeverityLevel>('routine');
  const [showEditEvidencePicker, setShowEditEvidencePicker] = useState(false);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const editFolderInputRef = useRef<HTMLInputElement>(null);
  
  // Preview state for photos/documents
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'document'>('image');
  const [previewName, setPreviewName] = useState("");
  
  // PDF Export state
  const [isExporting, setIsExporting] = useState(false);
  const [hasExportedPdf, setHasExportedPdf] = useState(false);
  
  // AI Analysis daily usage tracking (3 per day limit)
  const getAnalysisUsageKey = () => `analysis_usage_${id}_${new Date().toISOString().slice(0, 10)}`;
  const getAnalysisUsageCount = () => {
    try { return parseInt(localStorage.getItem(getAnalysisUsageKey()) || '0', 10); } catch { return 0; }
  };
  const incrementAnalysisUsage = () => {
    const count = getAnalysisUsageCount() + 1;
    localStorage.setItem(getAnalysisUsageKey(), String(count));
    setAnalysisUsageCount(count);
  };
  const [analysisUsageCount, setAnalysisUsageCount] = useState(() => {
    try { return parseInt(localStorage.getItem(`analysis_usage_${id}_${new Date().toISOString().slice(0, 10)}`) || '0', 10); } catch { return 0; }
  });
  const ANALYSIS_DAILY_LIMIT = 3;
  const MIN_EVIDENCE_COUNT = 3;

  // Litigation Review state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    summary: string;
    evidenceScore: number;
    recommendation: 'strong' | 'moderate' | 'weak';
    violations: { code: string; description: string; severity: 'high' | 'medium' | 'low' }[];
    timelineAnalysis: string;
    nextSteps: string[];
    strengthFactors?: string[];
    weaknessFactors?: string[];
  } | null>(null);
  
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [drawerOpenedByTour, setDrawerOpenedByTour] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  
  // Auto-open mobile drawer when tour step requires it (only controls tour-related opens)
  useEffect(() => {
    const checkTourDrawer = () => {
      if (window.innerWidth < 768) {
        const tourNeedsDrawer = shouldOpenMobileDrawer();
        if (tourNeedsDrawer && !mobileDrawerOpen) {
          setMobileDrawerOpen(true);
          setDrawerOpenedByTour(true);
        } else if (!tourNeedsDrawer && drawerOpenedByTour) {
          // Only auto-close if the drawer was opened by the tour
          setMobileDrawerOpen(false);
          setDrawerOpenedByTour(false);
        }
      }
    };
    checkTourDrawer();
    // Check periodically in case tour step changes
    const interval = setInterval(checkTourDrawer, 500);
    return () => clearInterval(interval);
  }, [mobileDrawerOpen, drawerOpenedByTour]);
  
  // Toast dismiss ref for persistent regeneration toast
  const resendToastRef = useRef<(() => void) | null>(null);
  
  // Log dialog photo refs and evidence picker
  const logPhotoInputRef = useRef<HTMLInputElement>(null);
  const logDocInputRef = useRef<HTMLInputElement>(null);
  const [showLogEvidencePicker, setShowLogEvidencePicker] = useState(false);
  
  // Files section state - track expanded groups
  const [expandedFileGroups, setExpandedFileGroups] = useState<Set<string>>(new Set());
  
  // Chat groups state - track which chat groups are expanded
  const [expandedChatGroups, setExpandedChatGroups] = useState<Set<string>>(new Set());

  const { data: incident, refetch: refetchIncident } = useQuery<Incident>({
    queryKey: [`/api/incidents/${id}`],
    enabled: !!id,
  });

  const { data: logs } = useQuery<IncidentLog[]>({
    queryKey: [`/api/incidents/${id}/logs`],
    enabled: !!id,
  });

  // Get log ID from URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const targetLogId = urlParams.get('log');
  
  // Track which log ID we've scrolled to (to prevent duplicate scrolls)
  const scrolledToLogId = useRef<string | null>(null);
  
  // Reset scroll tracking when incident ID changes (new page load)
  useEffect(() => {
    scrolledToLogId.current = null;
  }, [id]);
  
  useEffect(() => {
    // Only scroll if we have a target log ID and logs are loaded
    if (targetLogId && logs && logs.length > 0 && scrolledToLogId.current !== targetLogId) {
      const logIdNum = parseInt(targetLogId);
      setHighlightedLogId(logIdNum);
      scrolledToLogId.current = targetLogId;
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        // Try chat-entry first (main chat panel) since that's the primary view
        const chatElement = document.getElementById(`chat-entry-${targetLogId}`);
        const timelineElement = document.getElementById(`log-entry-${targetLogId}`);
        
        // Scroll chat panel first
        if (chatElement) {
          chatElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        // Also scroll timeline if element exists
        if (timelineElement) {
          setTimeout(() => {
            timelineElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 150);
        }
        
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedLogId(null), 3000);
      }, 400);
    } else if (!targetLogId && scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
      scrolledToLogId.current = null;
    }
  }, [logs, targetLogId]);

  useEffect(() => {
    // Scroll to bottom when logs change, with small delay to ensure content is rendered
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [logs?.length]);

  // Count evidence entries for AI analysis gate
  const evidenceTypes = ['call', 'text', 'email', 'photo', 'document', 'note', 'call_photo', 'text_photo', 'email_photo', 'service', 'service_photo', 'service_document'];
  const evidenceCount = useMemo(() => logs?.filter(l => evidenceTypes.includes(l.type)).length || 0, [logs]);
  const hasEnoughEvidence = evidenceCount >= MIN_EVIDENCE_COUNT;
  const hasReachedDailyLimit = analysisUsageCount >= ANALYSIS_DAILY_LIMIT;
  const canRunAnalysis = hasEnoughEvidence && !hasReachedDailyLimit && !isAnalyzing;

  const getAnalysisButtonLabel = () => {
    if (isAnalyzing) return 'Analyzing...';
    if (hasReachedDailyLimit) return 'Limit reached';
    if (!hasEnoughEvidence) return `Need ${MIN_EVIDENCE_COUNT - evidenceCount} more entries`;
    return 'AI Analysis';
  };

  const remainingEvidence = Math.max(0, MIN_EVIDENCE_COUNT - evidenceCount);
  const hasUnlockRequirements = hasExportedPdf && hasEnoughEvidence;

  const AnalysisUnlockChecklist = () => (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] text-slate-600">
      <p className="mb-1 font-semibold text-slate-700">AI Analysis unlock checklist</p>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          {hasExportedPdf ? <Check className="h-3 w-3 text-green-600" /> : <Minus className="h-3 w-3 text-slate-400" />}
          <span>Export case PDF once</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasEnoughEvidence ? <Check className="h-3 w-3 text-green-600" /> : <Minus className="h-3 w-3 text-slate-400" />}
          <span>
            Add evidence entries ({Math.min(evidenceCount, MIN_EVIDENCE_COUNT)}/{MIN_EVIDENCE_COUNT})
            {!hasEnoughEvidence ? ` — ${remainingEvidence} more needed` : ''}
          </span>
        </div>
      </div>
      {hasReachedDailyLimit && (
        <p className="mt-1 text-amber-700">Daily limit reached ({analysisUsageCount}/{ANALYSIS_DAILY_LIMIT}). Try again tomorrow.</p>
      )}
      {hasUnlockRequirements && !hasReachedDailyLimit && (
        <p className="mt-1 text-green-700">Ready: AI analysis is unlocked.</p>
      )}
    </div>
  );

  // Auto-focus chat input when no messages (shows blinking cursor)
  const chatLogsCount = logs?.filter(l => l.type === 'chat').length || 0;
  const shouldAutoFocus = chatLogsCount === 0;

  useEffect(() => {
    if (incident) {
      setEditTitle(incident.title);
      setEditDescription(incident.description || "");
    }
  }, [incident]);

  useEffect(() => {
    // Check for pending chat message from dashboard
    const pendingMsg = localStorage.getItem('pending_chat_msg');
    if (pendingMsg) {
      chatInputRef.current?.setInput(pendingMsg);
      localStorage.removeItem('pending_chat_msg');
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 500);
    }
  }, []);

  const sendMutation = useMutation({
    mutationFn: async ({ message, attachments }: { message: string; attachments: string[] }) => {
      const res = await apiRequest("POST", "/api/chat", {
        incidentId: parseInt(id!),
        message,
        attachedImages: attachments.length > 0 ? attachments : undefined,
      });
      return await res.json();
    },
    onMutate: async ({ message, attachments }) => {
      await queryClient.cancelQueries({ queryKey: [`/api/incidents/${id}/logs`] });
      const previousLogs = queryClient.getQueryData<IncidentLog[]>([`/api/incidents/${id}/logs`]);
      const savedInput = message;
      const savedAttachments = [...attachments];
      const optimisticLog: IncidentLog = {
        id: -Date.now(),
        incidentId: parseInt(id!),
        type: "chat",
        title: null,
        content: message,
        fileUrl: null,
        metadata: attachments.length > 0 ? { attachedImages: attachments } : null,
        isAi: false,
        createdAt: new Date(),
      };
      queryClient.setQueryData<IncidentLog[]>([`/api/incidents/${id}/logs`], (old) => 
        old ? [...old, optimisticLog] : [optimisticLog]
      );
      return { previousLogs, savedInput, savedAttachments };
    },
    onError: (err, variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData([`/api/incidents/${id}/logs`], context.previousLogs);
      }
      if (context?.savedInput) chatInputRef.current?.setInput(context.savedInput);
      if (context?.savedAttachments) chatInputRef.current?.setAttachments(context.savedAttachments);
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${id}/logs`] });
      const scrollToBottom = () => {
        if (scrollRef.current) {
          const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
          if (viewport) viewport.scrollTop = viewport.scrollHeight;
        }
      };
      setTimeout(scrollToBottom, 200);
      setTimeout(scrollToBottom, 500);
      setTimeout(scrollToBottom, 1000);
    },
  });

  // Cascade delete - delete a message and all messages after it
  const cascadeDeleteMutation = useMutation({
    mutationFn: async (logId: number) => {
      await apiRequest("DELETE", `/api/logs/${logId}/cascade`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${id}/logs`] });
      toast({ title: "Messages Deleted", description: "Message and all following messages have been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete messages.", variant: "destructive" });
    },
  });

  // Resend/regenerate AI response - delete from a message onwards and resend
  const resendMutation = useMutation({
    mutationFn: async ({ logId, message }: { logId: number; message: string }) => {
      // First cascade delete from the message
      await apiRequest("DELETE", `/api/logs/${logId}/cascade`);
      // Then send the message again
      const res = await apiRequest("POST", "/api/chat", {
        incidentId: parseInt(id!),
        message,
      });
      return await res.json();
    },
    onMutate: () => {
      const t = toast({ title: "Regenerating", description: "Getting a new response...", duration: Infinity });
      resendToastRef.current = t.dismiss;
    },
    onSuccess: () => {
      resendToastRef.current?.();
      resendToastRef.current = null;
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${id}/logs`] });
    },
    onError: () => {
      resendToastRef.current?.();
      resendToastRef.current = null;
      toast({ title: "Error", description: "Failed to regenerate response.", variant: "destructive" });
    },
  });

  // Edit and resend - delete from this message, save new content and get new AI response
  const editAndResendMutation = useMutation({
    mutationFn: async ({ logId, newContent, attachments }: { logId: number; newContent: string; attachments: string[] }) => {
      // Cascade delete from this message
      await apiRequest("DELETE", `/api/logs/${logId}/cascade`);
      // Send the edited message with attachments
      const res = await apiRequest("POST", "/api/chat", {
        incidentId: parseInt(id!),
        message: newContent,
        attachedImages: attachments.length > 0 ? attachments : undefined,
      });
      return await res.json();
    },
    onSuccess: () => {
      setEditLogId(null);
      setEditLogContent("");
      setEditLogAttachments([]);
      setShowEditEvidencePicker(false);
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${id}/logs`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resend message.", variant: "destructive" });
    },
  });
  
  // Handle file upload during edit (supports multiple files - photos and documents)
  const handleEditPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Determine base category based on the log type being edited
    const editingLog = logs?.find(l => l.id === editLogId);
    const logType = editingLog?.type;
    
    for (const file of Array.from(files)) {
      // Determine if file is a photo or document based on mime type
      const isPhoto = file.type.startsWith('image/');
      const suffix = isPhoto ? '_photo' : '_document';
      
      let category = isPhoto ? 'chat_photo' : 'chat_document'; // fallback for chat messages
      if (logType === 'email') category = `email${suffix}`;
      else if (logType === 'text') category = `text${suffix}`;
      else if (logType === 'call') category = `call${suffix}`;
      
      const formData = new FormData();
      formData.append("file", file);
      // Include parentLogId to link file to this specific log
      if (editLogId) {
        formData.append("parentLogId", editLogId.toString());
      }
      try {
        const res = await fetch(`/api/incidents/${id}/upload?category=${category}`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setEditLogAttachments(prev => [...prev, data.fileUrl]);
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to upload file.", variant: "destructive" });
      }
    }
    e.target.value = '';
  };

  const deleteIncidentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/incidents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      toast({ title: "Incident Deleted", description: "The case has been removed." });
      navigate("/dashboard");
    },
  });

  const updateIncidentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/incidents/${id}`, { 
        title: editTitle, 
        description: editDescription 
      });
      return await res.json();
    },
    onSuccess: () => {
      refetchIncident();
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      setEditIncidentOpen(false);
      toast({ title: "Updated", description: "Entry details have been updated." });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const newStatus = incident?.status === "open" ? "closed" : "open";
      const res = await apiRequest("PATCH", `/api/incidents/${id}/status`, { status: newStatus });
      return await res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [`/api/incidents/${id}`] });
      const previous = queryClient.getQueryData([`/api/incidents/${id}`]);
      queryClient.setQueryData([`/api/incidents/${id}`], (old: any) => {
        if (!old) return old;
        return { ...old, status: old.status === 'open' ? 'closed' : 'open' };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([`/api/incidents/${id}`], context.previous);
      }
    },
    onSettled: () => {
      refetchIncident();
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
    },
    onSuccess: () => {
      toast({ title: "Status Updated" });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, category }: { file: File; category?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      const url = category 
        ? `/api/incidents/${id}/upload?category=${category}`
        : `/api/incidents/${id}/upload`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return await res.json();
    },
    onMutate: async ({ file, category }: { file: File; category?: string }) => {
      await queryClient.cancelQueries({ queryKey: [`/api/incidents/${id}/logs`] });
      const previousLogs = queryClient.getQueryData<IncidentLog[]>([`/api/incidents/${id}/logs`]);
      const isImage = file.type.startsWith('image/');
      const optimisticLog: IncidentLog = {
        id: -Date.now(),
        incidentId: parseInt(id!),
        type: isImage ? "photo" : "document",
        title: null,
        content: file.name,
        fileUrl: isImage ? URL.createObjectURL(file) : null,
        metadata: { uploading: true, originalName: file.name, ...(category && { category }) },
        isAi: false,
        createdAt: new Date(),
      };
      queryClient.setQueryData<IncidentLog[]>([`/api/incidents/${id}/logs`], (old) => 
        old ? [...old, optimisticLog] : [optimisticLog]
      );
      return { previousLogs };
    },
    onError: (err, variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData([`/api/incidents/${id}/logs`], context.previousLogs);
      }
      toast({ title: "Upload Failed", description: "Could not upload file.", variant: "destructive" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${id}/logs`] });
      const type = data.type === "photo" ? "Photo" : "Document";
      toast({ title: `${type} Added`, description: "Your evidence has been logged." });
    },
  });

  const createLogWithPhotoMutation = useMutation({
    mutationFn: async ({ type, title, notes, photos, documents, severity }: { type: string; title: string; notes: string; photos: File[]; documents: File[]; severity?: SeverityLevel }) => {
      const now = new Date();
      const typeLabel = type === 'call' ? 'Call' : type === 'text' ? 'Text' : 'Email';
      const effectiveSeverity = severity || DEFAULT_SEVERITY_BY_TYPE[type] || 'routine';
      
      const logRes = await apiRequest("POST", `/api/incidents/${id}/logs`, {
        incidentId: parseInt(id!),
        type,
        title: title || null,
        content: notes || `${typeLabel} logged at ${format(now, "MMM d, yyyy 'at' h:mm a")}`,
        isAi: false,
        metadata: { loggedAt: now.toISOString(), hasPhoto: photos.length > 0, photoCount: photos.length, hasDocument: documents.length > 0, documentCount: documents.length, severity: effectiveSeverity },
      });
      const logData = await logRes.json();
      
      // Upload all photos with a category reference
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("file", photo);
        formData.append("category", `${type}_photo`);
        formData.append("parentLogId", logData.id.toString());
        const uploadRes = await fetch(`/api/incidents/${id}/upload?category=${type}_photo`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!uploadRes.ok) throw new Error("Photo upload failed");
      }
      
      // Upload all documents with a category reference
      for (const doc of documents) {
        const formData = new FormData();
        formData.append("file", doc);
        formData.append("category", `${type}_document`);
        formData.append("parentLogId", logData.id.toString());
        const uploadRes = await fetch(`/api/incidents/${id}/upload?category=${type}_document`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!uploadRes.ok) throw new Error("Document upload failed");
      }
      
      return logData;
    },
    onMutate: async ({ type, title, notes, photos, severity }) => {
      await queryClient.cancelQueries({ queryKey: [`/api/incidents/${id}/logs`] });
      const previousLogs = queryClient.getQueryData<IncidentLog[]>([`/api/incidents/${id}/logs`]);
      const now = new Date();
      const typeLabel = type === 'call' ? 'Call' : type === 'text' ? 'Text' : 'Email';
      const effectiveSeverity = severity || DEFAULT_SEVERITY_BY_TYPE[type] || 'routine';
      const optimisticLog: IncidentLog = {
        id: -Date.now(),
        incidentId: parseInt(id!),
        type,
        title: title || null,
        content: notes || `${typeLabel} logged at ${format(now, "MMM d, yyyy 'at' h:mm a")}`,
        fileUrl: null,
        metadata: { loggedAt: now.toISOString(), hasPhoto: photos.length > 0, photoCount: photos.length, severity: effectiveSeverity },
        isAi: false,
        createdAt: now,
      };
      queryClient.setQueryData<IncidentLog[]>([`/api/incidents/${id}/logs`], (old) => 
        old ? [...old, optimisticLog] : [optimisticLog]
      );
      setLogTitle("");
      setLogNotes("");
      setLogSeverity('routine');
      setLogPhotoFiles([]);
      setLogDocFiles([]);
      setLogCallOpen(false);
      setLogTextOpen(false);
      setLogEmailOpen(false);
      return { previousLogs };
    },
    onError: (err, variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData([`/api/incidents/${id}/logs`], context.previousLogs);
      }
      toast({ title: "Error", description: "Failed to create log.", variant: "destructive" });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${id}/logs`] });
      const typeLabel = variables.type === 'call' ? 'Call' : variables.type === 'text' ? 'Text' : 'Email';
      toast({ title: `${typeLabel} Logged`, description: `${typeLabel} has been recorded.` });
    },
  });

  const updateLogMutation = useMutation({
    mutationFn: async ({ logId, content, severity }: { logId: number; content: string; severity?: SeverityLevel }) => {
      const log = logs?.find(l => l.id === logId);
      const metadata = log ? { ...(log.metadata as any), severity } : { severity };
      const res = await apiRequest("PATCH", `/api/logs/${logId}`, { content, metadata });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${id}/logs`] });
      setEditLogId(null);
      setEditLogContent("");
      setEditLogSeverity('routine');
      toast({ title: "Updated", description: "Timeline entry has been updated." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (logId: number) => {
      await apiRequest("DELETE", `/api/logs/${logId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${id}/logs`] });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] }); // Invalidate incidents to refresh active logs everywhere
      toast({ title: "Deleted", description: "Evidence removed from case." });
    },
  });

  // Track PDF export and trigger AI litigation review
  const trackPdfExport = async () => {
    try {
      await apiRequest("POST", `/api/incidents/${id}/pdf-export`);
    } catch (error) {
      console.error("Failed to track PDF export:", error);
    }
  };

  const triggerLitigationReview = async () => {
    if (!id || !canRunAnalysis) return;
    
    setIsAnalyzing(true);
    incrementAnalysisUsage();
    try {
      const response = await apiRequest("POST", `/api/incidents/${id}/litigation-review`, {
        triggeredBy: 'user'
      });
      const data = await response.json();
      const result = data.fullAnalysis || data;
      setAnalysisResult(result);
      setShowAnalysisModal(true);
      toast({
        title: "Analysis Complete",
        description: "Your case has been analyzed for litigation potential.",
      });
    } catch (error: any) {
      console.error("Litigation review error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFileMutation.mutate({ file, category: 'incident_photo' });
    e.target.value = "";
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFileMutation.mutate({ file, category: 'incident_document' });
    e.target.value = "";
  };

  const handleLogSubmit = (type: string) => {
    const photos = logPhotoFiles.filter(f => f.type.startsWith('image/'));
    const documents = [...logDocFiles, ...logPhotoFiles.filter(f => !f.type.startsWith('image/'))];
    createLogWithPhotoMutation.mutate({ type, title: logTitle, notes: logNotes, photos, documents, severity: logSeverity });
  };
  
  const handleLogPhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setLogPhotoFiles(prev => [...prev, ...Array.from(files)]);
    }
    e.target.value = "";
  };
  
  const removeLogPhoto = (index: number) => {
    setLogPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogDocAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setLogDocFiles(prev => [...prev, ...Array.from(files)]);
    }
    e.target.value = "";
  };
  
  const removeLogDoc = (index: number) => {
    setLogDocFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getAttachedPhotos = (log: IncidentLog): IncidentLog[] => {
    if (log.type !== 'call' && log.type !== 'text' && log.type !== 'email' && log.type !== 'photo' && log.type !== 'service') return [];
    // Find photos with parentLogId matching this log's ID
    return logs?.filter(l => {
      const parentLogId = (l.metadata as any)?.parentLogId;
      return l.type === 'photo' && parentLogId === log.id;
    }) || [];
  };

  const getAttachedDocuments = (log: IncidentLog): IncidentLog[] => {
    if (log.type !== 'call' && log.type !== 'text' && log.type !== 'email' && log.type !== 'service') return [];
    // Find documents with parentLogId matching this log's ID
    return logs?.filter(l => {
      const parentLogId = (l.metadata as any)?.parentLogId;
      return l.type === 'document' && parentLogId === log.id;
    }) || [];
  };

  const openEditLog = (log: IncidentLog) => {
    setEditLogId(log.id);
    setEditLogContent(log.content);
    setEditLogSeverity(getLogSeverity(log));
    // Load existing attachments (photos and documents) linked via parentLogId
    const attachedPhotos = getAttachedPhotos(log);
    const attachedDocs = getAttachedDocuments(log);
    const allAttachmentUrls = [
      ...attachedPhotos.map(p => p.fileUrl!),
      ...attachedDocs.map(d => d.fileUrl!)
    ].filter(Boolean);
    setEditLogAttachments(allAttachmentUrls);
    // For photo entries with their own fileUrl, also include it
    if (log.type === 'photo' && log.fileUrl) {
      setEditLogPhoto(log);
    } else {
      setEditLogPhoto(null);
    }
  };

  const openPreview = (log: IncidentLog) => {
    if (log.fileUrl) {
      const isImage = log.type === 'photo' || log.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      setPreviewUrl(log.fileUrl);
      setPreviewType(isImage ? 'image' : 'document');
      setPreviewName(log.content);
    }
  };

  const chatLogs = useMemo(() => logs?.filter(l => l.type === 'chat').sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.id - b.id;
  }) || [], [logs]);

  const getMetaCategory = (log: IncidentLog) => (log.metadata as any)?.category;

  const { allPhotos, allDocuments, photos, documents } = useMemo(() => {
    const allPhotos = logs?.filter(l => l.type === 'photo') || [];
    const allDocuments = logs?.filter(l => l.type === 'document') || [];
    const photos = logs?.filter(l => l.type === 'photo' && !getMetaCategory(l) && !l.title) || [];
    const documents = logs?.filter(l => l.type === 'document') || [];
    return { allPhotos, allDocuments, photos, documents };
  }, [logs]);

  const fileGroups = useMemo(() => {
    const groups: { id: string; label: string; icon: any; color: string; files: IncidentLog[]; type: string }[] = [];
    const usedPhotoIds = new Set<number>();
    const usedDocIds = new Set<number>();
    
    const incidentPhotos = allPhotos.filter(p => getMetaCategory(p) === 'incident_photo');
    incidentPhotos.forEach(p => usedPhotoIds.add(p.id));
    if (incidentPhotos.length > 0 && incident) {
      groups.push({
        id: 'incident',
        label: incident.title,
        icon: FolderOpen,
        color: 'text-slate-700',
        files: incidentPhotos,
        type: 'incident'
      });
    }
    
    const logsWithPotentialAttachments = logs?.filter(l => 
      l.type === 'call' || l.type === 'text' || l.type === 'email' || l.type === 'service' || (l.type === 'photo' && l.title)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) || [];
    
    logsWithPotentialAttachments.forEach(log => {
      const attachedPhotos = allPhotos.filter(p => {
        const parentLogId = (p.metadata as any)?.parentLogId;
        return p.type === 'photo' && parentLogId === log.id;
      });
      const attachedDocs = allDocuments.filter(d => {
        const parentLogId = (d.metadata as any)?.parentLogId;
        return parentLogId === log.id;
      });
      
      let icon = FileText;
      let color = 'text-slate-500';
      let typeLabel = log.type.charAt(0).toUpperCase() + log.type.slice(1);
      
      if (log.type === 'call') { icon = Phone; color = 'text-blue-500'; }
      else if (log.type === 'text') { icon = MessageSquare; color = 'text-green-500'; }
      else if (log.type === 'email') { icon = Mail; color = 'text-purple-500'; }
      else if (log.type === 'service') { icon = Wrench; color = 'text-orange-500'; }
      else if (log.type === 'photo') { icon = ImageIcon; color = 'text-blue-500'; }
      else if (log.type === 'note') { icon = FileText; color = 'text-slate-500'; }
      
      const label = log.title ? `${typeLabel}: ${log.title}` : `${typeLabel}: ${log.content?.substring(0, 30)}${(log.content?.length || 0) > 30 ? '...' : ''}`;
      
      const files: IncidentLog[] = [];
      if (log.type === 'photo' && log.fileUrl) {
        files.push(log);
        usedPhotoIds.add(log.id);
      }
      attachedPhotos.forEach(p => {
        files.push(p);
        usedPhotoIds.add(p.id);
      });
      attachedDocs.forEach(d => {
        files.push(d);
        usedDocIds.add(d.id);
      });
      
      if (files.length > 0) {
        groups.push({
          id: `log-${log.id}`,
          label,
          icon,
          color,
          files,
          type: log.type
        });
      }
    });
    
    const chatFiles: IncidentLog[] = [];
    const chatCategoryPhotos = allPhotos.filter(p => !usedPhotoIds.has(p.id) && getMetaCategory(p) === 'chat_photo');
    chatCategoryPhotos.forEach(p => { chatFiles.push(p); usedPhotoIds.add(p.id); });
    const chatCategoryDocs = allDocuments.filter(d => !usedDocIds.has(d.id) && getMetaCategory(d) === 'chat_document');
    chatCategoryDocs.forEach(d => { chatFiles.push(d); usedDocIds.add(d.id); });
    if (chatFiles.length > 0) {
      groups.push({
        id: 'chat-files',
        label: 'Chat Files',
        icon: Bot,
        color: 'text-slate-600',
        files: chatFiles.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        type: 'chat'
      });
    }

    const standalonePhotos = allPhotos.filter(p => !usedPhotoIds.has(p.id));
    if (standalonePhotos.length > 0) {
      groups.push({
        id: 'standalone-photos',
        label: 'Other Photos',
        icon: ImageIcon,
        color: 'text-slate-500',
        files: standalonePhotos,
        type: 'standalone'
      });
    }
    
    const standaloneDocuments = allDocuments.filter(d => !usedDocIds.has(d.id));
    if (standaloneDocuments.length > 0) {
      groups.push({
        id: 'documents',
        label: 'Documents',
        icon: Paperclip,
        color: 'text-slate-500',
        files: standaloneDocuments,
        type: 'document'
      });
    }
    
    return groups;
  }, [logs, incident]);

  const toggleFileGroup = (groupId: string) => {
    setExpandedFileGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const allTimelineLogs = useMemo(() => logs?.filter(l => 
    l.type === 'note' || 
    l.type === 'call' || 
    l.type === 'text' || 
    l.type === 'email' ||
    l.type === 'service' ||
    l.type === 'chat' ||
    (l.type === 'photo' && (getMetaCategory(l) || l.title))
  ).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeA - timeB;
  }) || [], [logs]);

  type TimelineItem = { type: 'single'; log: IncidentLog } | { type: 'chat_group'; id: string; chats: IncidentLog[] };
  
  const timelineItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];
    let currentChatGroup: IncidentLog[] = [];
    let chatGroupIndex = 0;
    
    for (const log of allTimelineLogs) {
      const category = getMetaCategory(log);
      if (log.type === 'photo' && category) continue;
      
      if (log.type === 'chat') {
        currentChatGroup.push(log);
      } else {
        if (currentChatGroup.length > 0) {
          items.push({ type: 'chat_group', id: `chat-group-${chatGroupIndex}`, chats: currentChatGroup });
          chatGroupIndex++;
          currentChatGroup = [];
        }
        items.push({ type: 'single', log });
      }
    }
    
    if (currentChatGroup.length > 0) {
      items.push({ type: 'chat_group', id: `chat-group-${chatGroupIndex}`, chats: currentChatGroup });
    }
    
    return items;
  }, [allTimelineLogs]);

  const toggleChatGroup = (groupId: string) => {
    setExpandedChatGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Skeleton loading state
  if (!incident) {
    return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-slate-50">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex md:flex-col md:w-80 bg-white border-r border-slate-200 p-4">
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-full bg-slate-200 rounded animate-pulse mb-1" />
          <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mb-6" />
          <div className="space-y-3 flex-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 p-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Chat area skeleton */}
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
                <div className="max-w-[70%]">
                  <div className="h-20 w-64 bg-slate-200 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-12 w-full bg-slate-200 rounded animate-pulse mt-4" />
        </div>
      </div>
    );
  }

  const formatDateTime = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy  h:mm a");
  };

  const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    const [resolvedSrc, setResolvedSrc] = useState(src);
    const [triedProxy, setTriedProxy] = useState(false);

    useEffect(() => {
      setResolvedSrc(src);
      setTriedProxy(false);
    }, [src]);

    const toProxyUrl = (url: string) => {
      try {
        const u = new URL(url, window.location.origin);
        const marker = "/evidence/";
        const idx = u.pathname.indexOf(marker);
        if (idx === -1) return null;
        const key = u.pathname.slice(idx + 1);
        return `/api/r2/${key}`;
      } catch {
        return null;
      }
    };

    return (
      <img
        src={resolvedSrc}
        loading="lazy"
        alt={alt}
        className={className}
        onError={() => {
          if (!triedProxy) {
            const proxy = toProxyUrl(resolvedSrc);
            if (proxy) {
              setTriedProxy(true);
              setResolvedSrc(proxy);
              return;
            }
          }
          setResolvedSrc('/favicon.png');
        }}
      />
    );
  };

  const LogEntryCard = ({ log, icon: Icon, color, clickable = false }: { log: IncidentLog; icon: any; color: string; clickable?: boolean }) => {
    // Only user chat messages get blue styling
    const isUserChat = (log.type === 'chat' && !log.isAi);
    // Get label for the entry type
    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'call': return 'Call';
        case 'text': return 'Text';
        case 'email': return 'Email';
        case 'photo': return 'Photo';
        case 'chat': return 'Chat';
        case 'note': return 'Note';
        default: return type.charAt(0).toUpperCase() + type.slice(1);
      }
    };
    
    return (
      <Card 
        id={`log-entry-${log.id}`}
        key={log.id} 
        className={`p-1.5 group transition-all duration-500 cursor-pointer ${
          isUserChat 
            ? 'bg-[var(--color-user-bubble)] border-[var(--color-user-bubble-border)] hover:bg-[var(--color-user-bubble)]/90' 
            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
        } ${highlightedLogId === log.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`} 
        onClick={() => {
          if (log.type === 'chat') {
            const element = document.getElementById(`chat-entry-${log.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'end' });
              setHighlightedLogId(log.id);
              setTimeout(() => setHighlightedLogId(null), 3000);
            }
          } else if (log.fileUrl) {
            openPreview(log);
          }
        }}
      >
        {/* Header row: icon + label */}
        <div className="flex items-center justify-between gap-1.5 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon className={`w-3 h-3 ${color} shrink-0`} />
            <span className="font-medium text-slate-800 text-xs line-clamp-1">
              {getTypeLabel(log.type)}{log.title ? `: ${log.title}` : ''}
            </span>
          </div>
        </div>
        {/* Description */}
        <div className="text-slate-600 text-xs line-clamp-2 font-normal prose prose-slate max-w-none prose-p:my-0">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({children}) => <span className="inline">{children}</span>,
              strong: ({children}) => <strong className="font-semibold">{children}</strong>,
              em: ({children}) => <em className="italic">{children}</em>,
              h1: ({children}) => <span className="font-bold">{children}</span>,
              h2: ({children}) => <span className="font-bold">{children}</span>,
              h3: ({children}) => <span className="font-semibold">{children}</span>,
            }}
          >
            {log.content}
          </ReactMarkdown>
        </div>
        {/* Footer: date, severity badge, and actions */}
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">{formatDateTime(log.createdAt)}</span>
            {(() => {
              const sev = getLogSeverity(log);
              if (sev === 'critical') return <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200" data-testid={`badge-severity-${log.id}`}><AlertTriangle className="w-2.5 h-2.5" />Critical</span>;
              if (sev === 'important') return <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200" data-testid={`badge-severity-${log.id}`}><Info className="w-2.5 h-2.5" />Important</span>;
              return null;
            })()}
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {(log.type === 'call' || log.type === 'text' || log.type === 'email' || log.type === 'service') && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700"
                onClick={() => {
                  const typeLabel = log.type === 'call' ? 'Call log' : log.type === 'text' ? 'Text log' : log.type === 'email' ? 'Email log' : 'Service request log';
                  chatInputRef.current?.setInput(`Add this to our discussion: [${typeLabel}] ${log.content}`);
                  setTimeout(() => {
                    chatInputRef.current?.focus();
                  }, 100);
                }}
                title="Add to AI Chat"
              >
                <MessageSquare className="w-3 h-3" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-700"
              onClick={() => openEditLog(log)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-700">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently remove this entry from your case.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate(log.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>
    );
  };

  const ThumbnailWithDelete = ({ children, onDelete, onPreview, className = "" }: { 
    children: React.ReactNode; 
    onDelete: () => void; 
    onPreview: () => void;
    className?: string;
  }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const longPressTriggered = useRef(false);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
      if (!showDelete) return;
      const dismiss = (e: MouseEvent | TouchEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setShowDelete(false);
        }
      };
      document.addEventListener('mousedown', dismiss);
      document.addEventListener('touchstart', dismiss);
      return () => {
        document.removeEventListener('mousedown', dismiss);
        document.removeEventListener('touchstart', dismiss);
      };
    }, [showDelete]);
    
    const handleTouchStart = () => {
      longPressTriggered.current = false;
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        setShowDelete(true);
      }, 500);
    };
    
    const handleTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
    
    const handleClick = () => {
      if (longPressTriggered.current) {
        longPressTriggered.current = false;
        return;
      }
      if (showDelete) {
        setShowDelete(false);
        return;
      }
      onPreview();
    };
    
    return (
      <div 
        ref={wrapperRef}
        className={`relative group ${className}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onClick={handleClick}
      >
        {children}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
          title="Delete"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
        {showDelete && (
          <div className="absolute inset-0 bg-transparent flex items-center justify-center z-10 rounded md:hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowDelete(false);
              }}
              className="bg-white text-red-600 rounded-full p-1.5 shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchCurrentX.current !== null) {
      const diff = touchCurrentX.current - touchStartX.current;
      // Swipe right from left edge to open
      if (touchStartX.current < 50 && diff > 80) {
        setMobileDrawerOpen(true);
        setDrawerOpenedByTour(false);
      }
      // Swipe left to close
      if (mobileDrawerOpen && diff < -80) {
        setMobileDrawerOpen(false);
        setDrawerOpenedByTour(false);
      }
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  // PDF Export function with proper markdown rendering
  const exportToPDF = async () => {
    if (!incident || !logs) return;
    
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;
      
      // Helper to add page break if needed
      const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
      };
      
      // Helper to clean text - minimal cleanup, preserve most content
      const cleanText = (text: string): string => {
        let cleaned = text;
        // Only fix HTML entities - don't strip Unicode symbols
        cleaned = cleaned.replace(/&amp;/g, '&');
        cleaned = cleaned.replace(/&lt;/g, '<');
        cleaned = cleaned.replace(/&gt;/g, '>');
        cleaned = cleaned.replace(/&nbsp;/g, ' ');
        cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
          return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
        });
        // Replace only common emojis that don't render in jsPDF default fonts
        // Using try-catch to handle any encoding issues gracefully
        try {
          const emojiReplacements: [RegExp, string][] = [
            [/📞/g, '[Call]'],
            [/💬/g, '[Message]'],
            [/📧/g, '[Email]'],
            [/📷/g, '[Photo]'],
            [/🤖/g, '[AI]'],
            [/👤/g, '[User]'],
            [/🚀/g, ''],
            [/✅/g, '[OK]'],
            [/❌/g, '[X]'],
            [/⚠️/g, '[!]'],
            [/📋/g, '[List]'],
            [/📁/g, '[Folder]'],
            [/📄/g, '[Doc]'],
            [/🔗/g, '[Link]'],
            [/✓/g, '[OK]'],
            [/✔/g, '[OK]'],
            [/😊/g, ':)'],
          ];
          for (const [emoji, replacement] of emojiReplacements) {
            cleaned = cleaned.replace(emoji, replacement);
          }
        } catch {
          // If regex fails, continue with text as-is
        }
        return cleaned.trim();
      };
      
      // Helper to wrap and add text
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10): number => {
        pdf.setFontSize(fontSize);
        const cleaned = cleanText(text);
        const lines = pdf.splitTextToSize(cleaned, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * fontSize * 0.4;
      };
      
      // Parse markdown table and render it with dynamic column widths
      const renderTable = (tableText: string): void => {
        const lines = tableText.trim().split('\n').filter(l => l.trim());
        if (lines.length < 2) return;
        
        // Parse header row
        const parseRow = (row: string): string[] => {
          return row.split('|').map(cell => cleanText(cell.trim())).filter(cell => cell);
        };
        
        const headers = parseRow(lines[0]);
        // Skip separator row (line with dashes)
        const dataRows = lines.slice(2).map(parseRow);
        
        if (headers.length === 0) return;
        
        // Calculate column widths proportionally based on content
        pdf.setFontSize(8);
        const maxColCount = Math.min(headers.length, 4); // Limit to 4 columns for readability
        const colWidth = contentWidth / maxColCount;
        const cellPadding = 2;
        const rowHeight = 6;
        const maxChars = Math.floor((colWidth - cellPadding * 2) / 2); // Approximate chars per column
        
        // Check for page break before table header
        checkPageBreak(rowHeight * 2 + 5);
        
        // Draw header row with background
        pdf.setFillColor(230, 230, 230);
        pdf.rect(margin, yPos - 3, contentWidth, rowHeight, 'F');
        pdf.setDrawColor(180, 180, 180);
        pdf.line(margin, yPos - 3, margin + contentWidth, yPos - 3);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        
        headers.slice(0, maxColCount).forEach((header, i) => {
          const cellX = margin + (i * colWidth) + cellPadding;
          const truncated = header.length > maxChars ? header.substring(0, maxChars - 2) + '..' : header;
          pdf.text(truncated, cellX, yPos);
        });
        yPos += rowHeight;
        
        // Draw separator line under header
        pdf.line(margin, yPos - 3, margin + contentWidth, yPos - 3);
        
        // Draw data rows
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        for (const row of dataRows) {
          checkPageBreak(rowHeight + 2);
          
          row.slice(0, maxColCount).forEach((cell, i) => {
            const cellX = margin + (i * colWidth) + cellPadding;
            const truncated = cell.length > maxChars ? cell.substring(0, maxChars - 2) + '..' : cell;
            pdf.text(truncated, cellX, yPos);
          });
          yPos += rowHeight;
        }
        
        // Draw bottom border
        pdf.line(margin, yPos - 3, margin + contentWidth, yPos - 3);
        yPos += 2;
      };
      
      // Render markdown content with proper formatting
      const renderMarkdown = (content: string): void => {
        const lines = content.split('\n');
        let inTable = false;
        let tableBuffer: string[] = [];
        let inCodeBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmedLine = line.trim();
          
          // Skip empty lines but add small spacing
          if (!trimmedLine) {
            if (!inTable && !inCodeBlock) {
              yPos += 2;
            }
            continue;
          }
          
          // Handle code blocks
          if (trimmedLine.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            if (!inCodeBlock) {
              yPos += 2;
            }
            continue;
          }
          
          if (inCodeBlock) {
            pdf.setFont('courier', 'normal');
            pdf.setFontSize(8);
            const codeLines = pdf.splitTextToSize(cleanText(trimmedLine), contentWidth - 10);
            const blockHeight = codeLines.length * 4 + 2;
            
            // Check for page break with full block height
            checkPageBreak(blockHeight);
            
            // Draw background for this line's code block portion
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, yPos - 3, contentWidth, blockHeight, 'F');
            pdf.setTextColor(60, 60, 60);
            pdf.text(codeLines, margin + 3, yPos);
            pdf.setTextColor(0, 0, 0);
            yPos += blockHeight;
            continue;
          }
          
          // Detect table rows
          if (trimmedLine.includes('|') && (trimmedLine.startsWith('|') || trimmedLine.match(/^\|?[\w\s-]+\|/))) {
            inTable = true;
            tableBuffer.push(trimmedLine);
            // Check if next line continues table or ends it
            const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
            if (!nextLine.includes('|')) {
              // End of table, render it
              renderTable(tableBuffer.join('\n'));
              tableBuffer = [];
              inTable = false;
              yPos += 3;
            }
            continue;
          }
          
          // Handle headers (### Header)
          if (trimmedLine.startsWith('###')) {
            checkPageBreak(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            const headerText = cleanText(trimmedLine.replace(/^###\s*/, ''));
            pdf.text(headerText, margin, yPos);
            yPos += 6;
            continue;
          }
          
          if (trimmedLine.startsWith('##')) {
            checkPageBreak(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            const headerText = cleanText(trimmedLine.replace(/^##\s*/, ''));
            pdf.text(headerText, margin, yPos);
            yPos += 7;
            continue;
          }
          
          if (trimmedLine.startsWith('#')) {
            checkPageBreak(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(14);
            const headerText = cleanText(trimmedLine.replace(/^#\s*/, ''));
            pdf.text(headerText, margin, yPos);
            yPos += 8;
            continue;
          }
          
          // Handle bullet points
          if (trimmedLine.match(/^[-*]\s/) || trimmedLine.match(/^\d+\.\s/)) {
            checkPageBreak(6);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            const bulletText = cleanText(trimmedLine.replace(/^[-*]\s/, '• ').replace(/^\d+\.\s/, (m) => m));
            const bulletLines = pdf.splitTextToSize(bulletText, contentWidth - 5);
            pdf.text(bulletLines, margin + 3, yPos);
            yPos += bulletLines.length * 4 + 1;
            continue;
          }
          
          // Handle bold text within lines - simplified approach
          let processedLine = cleanText(trimmedLine);
          const hasBold = processedLine.includes('**');
          
          if (hasBold) {
            checkPageBreak(8);
            // Strip bold markers and render with emphasis indicator
            const textWithoutBold = processedLine.replace(/\*\*([^*]+)\*\*/g, '$1');
            // Check if line is mostly bold (starts and ends with bold markers)
            const isMostlyBold = trimmedLine.startsWith('**') && trimmedLine.includes('**:');
            
            if (isMostlyBold) {
              pdf.setFont('helvetica', 'bold');
            } else {
              pdf.setFont('helvetica', 'normal');
            }
            pdf.setFontSize(9);
            const wrappedBold = pdf.splitTextToSize(textWithoutBold, contentWidth);
            pdf.text(wrappedBold, margin, yPos);
            yPos += wrappedBold.length * 4 + 2;
            continue;
          }
          
          // Regular paragraph text
          checkPageBreak(6);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          const wrappedLines = pdf.splitTextToSize(processedLine, contentWidth);
          pdf.text(wrappedLines, margin, yPos);
          yPos += wrappedLines.length * 4 + 1;
        }
      };

      // Helper to load image as base64
      const loadImageAsBase64 = async (url: string): Promise<string | null> => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      };
      
      // Title
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text('CASE REPORT', margin, yPos);
      yPos += 12;
      
      // Case Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const titleLines = pdf.splitTextToSize(incident.title, contentWidth);
      pdf.text(titleLines, margin, yPos);
      yPos += titleLines.length * 6 + 5;
      
      // Status badge and Date
      pdf.setFontSize(10);
      const statusColor = incident.status === 'open' ? [34, 197, 94] : [100, 116, 139]; // green or slate
      pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.roundedRect(margin, yPos - 4, 25, 7, 1, 1, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text(incident.status.toUpperCase(), margin + 3, yPos);
      
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Created: ${format(new Date(incident.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}`, margin + 30, yPos);
      yPos += 10;
      
      // Description
      if (incident.description) {
        checkPageBreak(20);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Description', margin, yPos);
        yPos += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const descLines = pdf.splitTextToSize(cleanText(incident.description), contentWidth);
        pdf.text(descLines, margin, yPos);
        yPos += descLines.length * 4 + 8;
      }
      
      // Separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      // Get chronological entries (calls, texts, emails, photos)
      const chronologicalLogs = logs.filter(l => 
        l.type === 'call' || l.type === 'text' || l.type === 'email' || l.type === 'photo' || l.type === 'service'
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // Section: Evidence Timeline
      if (chronologicalLogs.length > 0) {
        checkPageBreak(15);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text('EVIDENCE TIMELINE', margin, yPos);
        yPos += 10;
        pdf.setTextColor(0, 0, 0);
        
        for (const log of chronologicalLogs) {
          checkPageBreak(30);
          
          // Entry type header with icon text
          const typeLabel = log.type === 'call' ? '[CALL]' : 
                           log.type === 'text' ? '[TEXT]' : 
                           log.type === 'email' ? '[EMAIL]' : '[PHOTO]';
          
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(59, 130, 246); // blue-500
          pdf.text(typeLabel, margin, yPos);
          
          if (log.title) {
            pdf.setTextColor(0, 0, 0);
            pdf.text(` ${log.title}`, margin + pdf.getTextWidth(typeLabel) + 2, yPos);
          }
          yPos += 5;
          
          // Date
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 116, 139);
          pdf.text(format(new Date(log.createdAt), 'MMMM d, yyyy \'at\' h:mm a'), margin, yPos);
          yPos += 5;
          
          // Content
          if (log.content && log.type !== 'photo') {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            const contentLines = pdf.splitTextToSize(cleanText(log.content), contentWidth);
            pdf.text(contentLines, margin, yPos);
            yPos += contentLines.length * 4 + 3;
          }
          
          // Embedded photo for photo entries
          if (log.type === 'photo' && log.fileUrl) {
            checkPageBreak(60);
            const imgData = await loadImageAsBase64(log.fileUrl);
            if (imgData) {
              try {
                const imgWidth = 60;
                const imgHeight = 45;
                pdf.addImage(imgData, 'JPEG', margin, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 5;
              } catch {
                pdf.setFontSize(9);
                pdf.setTextColor(150, 150, 150);
                pdf.text('[Image could not be embedded]', margin, yPos);
                yPos += 5;
              }
            }
          }
          
          // Associated photos (for call/text/email entries)
          if (log.type !== 'photo') {
            const logCategory = `${log.type}_photo`;
            const associatedPhotos = logs.filter(p => 
              p.type === 'photo' && 
              p.metadata && 
              typeof p.metadata === 'object' &&
              (p.metadata as any).category === logCategory &&
              new Date(p.createdAt).getTime() - new Date(log.createdAt).getTime() < 60000 &&
              new Date(p.createdAt).getTime() - new Date(log.createdAt).getTime() >= 0
            );
            if (associatedPhotos.length > 0) {
              pdf.setFontSize(9);
              pdf.setFont('helvetica', 'italic');
              pdf.setTextColor(100, 116, 139);
              pdf.text('Attached Photos:', margin, yPos);
              yPos += 4;
              
              for (const photo of associatedPhotos) {
                checkPageBreak(55);
                if (photo.fileUrl) {
                  const imgData = await loadImageAsBase64(photo.fileUrl);
                  if (imgData) {
                    try {
                      const imgWidth = 50;
                      const imgHeight = 37.5;
                      pdf.addImage(imgData, 'JPEG', margin + 5, yPos, imgWidth, imgHeight);
                      yPos += imgHeight + 3;
                    } catch {
                      pdf.text('[Image could not be embedded]', margin + 5, yPos);
                      yPos += 5;
                    }
                  }
                }
              }
            }
          }
          
          yPos += 8;
        }
      }
      
      // Section: AI Chat History (if any chat messages exist)
      const chatLogs = logs.filter(l => l.type === 'chat');
      if (chatLogs.length > 0) {
        checkPageBreak(20);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text('AI CONSULTATION HISTORY', margin, yPos);
        yPos += 10;
        
        for (const chat of chatLogs) {
          checkPageBreak(25);
          const isAI = chat.isAi;
          
          // Speaker label with background
          if (isAI) {
            pdf.setFillColor(59, 130, 246); // blue-500
            pdf.roundedRect(margin, yPos - 4, 30, 6, 1, 1, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text('AI ASSISTANT', margin + 2, yPos);
          } else {
            pdf.setFillColor(100, 116, 139); // slate-500
            pdf.roundedRect(margin, yPos - 4, 15, 6, 1, 1, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text('YOU', margin + 2, yPos);
          }
          
          // Timestamp
          pdf.setTextColor(150, 150, 150);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          pdf.text(format(new Date(chat.createdAt), 'MMM d, h:mm a'), margin + (isAI ? 35 : 20), yPos);
          yPos += 6;
          
          // Chat content with markdown rendering
          pdf.setTextColor(0, 0, 0);
          if (chat.content) {
            renderMarkdown(chat.content);
          }
          yPos += 8;
        }
      }
      
      // Footer on each page
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} of ${pageCount}  |  Generated by YourRentalRights.com  |  ${format(new Date(), 'MMMM d, yyyy')}`,
          margin,
          pageHeight - 10
        );
      }
      
      // Save PDF
      const filename = `case-report-${incident.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(filename);
      
      // Track export in database and enable AI analysis button
      await trackPdfExport();
      setHasExportedPdf(true);
      
      toast({
        title: "PDF Exported",
        description: "Your case report has been downloaded. You can now run AI analysis.",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Sidebar content component to avoid duplication
  const SidebarContent = () => (
    <>
      <div className="border border-slate-300 rounded-lg p-4 pt-[16px] pb-[16px] mt-[13px] mb-[13px]">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => toggleStatusMutation.mutate()}
            disabled={toggleStatusMutation.isPending}
            className={`px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors pl-[10px] pr-[10px] pt-[4px] pb-[4px] ${
              incident.status === 'open'
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            data-testid="status-toggle-mobile"
          >
            <Clock className="w-3 h-3" />
            {incident.status === 'open' ? 'Open' : 'Closed'}
          </button>
        </div>
        <div className="flex items-center gap-1 mb-3">
          <Button 
            variant="ghost"
            size="sm"
            onClick={exportToPDF}
            disabled={isExporting}
            className="text-slate-600 hover:text-green-700 h-7 px-2 text-xs border border-slate-300 bg-[#4d5e700f]"
            data-testid="button-export-pdf"
          >
            <Download className={`w-3.5 h-3.5 mr-1 ${isExporting ? 'animate-pulse' : ''}`} />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={triggerLitigationReview}
            disabled={!canRunAnalysis}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 min-h-8 rounded-md h-7 px-2 text-xs border border-slate-300 text-slate-600 hover:text-blue-700 bg-[#4d5e700f] pt-[0px] pb-[0px] mt-[5px] mb-[5px] pl-[8px] pr-[8px] ml-[5px] mr-[5px]"
            title={!hasEnoughEvidence ? `Add at least ${MIN_EVIDENCE_COUNT} evidence entries to unlock` : hasReachedDailyLimit ? 'Daily limit reached — try again tomorrow' : 'Run AI case analysis'}
            data-testid="button-ai-analysis"
          >
            <Bot className={`w-3.5 h-3.5 mr-1 ${isAnalyzing ? 'animate-pulse' : ''}`} />
            {getAnalysisButtonLabel()}
          </Button>
        </div>
        <AnalysisUnlockChecklist />
        <h2 className="text-xl font-bold text-slate-900 mb-2 mt-3">{incident.title}</h2>
        <p className="text-sm text-slate-600 mb-2">{incident.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>{formatDateTime(incident.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Edit Button - triggers dialog rendered at root level */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setEditIncidentOpen(true);
              }}
              data-testid="button-edit-incident-mobile"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            
            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete This Case?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the case and all its evidence. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteIncidentMutation.mutate()} className="bg-red-600 hover:bg-red-700">
                    Delete Case
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Add Log section */}
      <div className="space-y-2 mt-2" data-testid="log-buttons-mobile">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 bg-[#4d5e700f] border-slate-300"
          onClick={() => { setLogCallOpen(true); }}
        >
          <Phone className="w-4 h-4 text-green-500" />
          <span>Record Call</span>
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 bg-[#4d5e700f] border-slate-300"
          onClick={() => { setLogTextOpen(true); }}
        >
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span>Record Text</span>
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 bg-[#4d5e700f] border-slate-300"
          onClick={() => { setLogEmailOpen(true); }}
        >
          <Mail className="w-4 h-4 text-purple-400" />
          <span>Record Email</span>
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 bg-[#4d5e700f] border-slate-300"
          onClick={() => { setLogServiceOpen(true); }}
        >
          <Wrench className="w-4 h-4 text-orange-500" />
          <span>Record Service Request</span>
        </Button>
      </div>

      <div className="space-y-6 mt-6">
        <div>
          <h3 className="font-bold uppercase tracking-wider text-left pl-[20px] pr-[20px] text-[16px] mt-[10px] mb-[10px] text-[#0f172a]">Timeline</h3>
          <div className="space-y-2">
            {/* Master Bubble - shows the incident itself */}
            {incident && (
              <div className="bg-purple-50/30 border border-purple-100 shadow-sm rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{incident.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    {incident.status === 'open' ? (
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-bold uppercase flex items-center gap-0.5 shrink-0">
                        <Clock className="w-2.5 h-2.5" /> Open
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-bold uppercase flex items-center gap-0.5 shrink-0">
                        <Clock className="w-2.5 h-2.5" /> Closed
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-500 text-xs line-clamp-2 mb-1">{incident.description}</p>
                <div className="text-xs text-slate-400">
                  {format(new Date(incident.createdAt), "MMM d, yyyy  h:mm a")}
                </div>
              </div>
            )}
            
            {/* Incident photos and documents - shown directly below master bubble with same structure as log attachments */}
            {(() => {
              const incidentPhotos = logs?.filter(l => l.type === 'photo' && (l.metadata as any)?.category === 'incident_photo') || [];
              // Get only incident-level documents (category is incident_document or not associated with any log type)
              const logDocCategories = ['call_document', 'text_document', 'email_document', 'service_document'];
              const incidentDocs = logs?.filter(l => {
                if (l.type !== 'document') return false;
                const cat = (l.metadata as any)?.category;
                // Show if it's explicitly incident_document OR if it doesn't belong to any log category
                return cat === 'incident_document' || !logDocCategories.includes(cat);
              }) || [];
              const hasAttachments = incidentPhotos.length > 0 || incidentDocs.length > 0;
              if (!hasAttachments) return null;
              return (
                <div className="ml-3 border-l-2 border-slate-200 pl-2 mt-0.5 flex flex-wrap gap-0.5">
                  {incidentPhotos.map((photo) => (
                    <ThumbnailWithDelete key={photo.id} onDelete={() => deleteMutation.mutate(photo.id)} onPreview={() => openPreview(photo)} className="w-10 h-10 overflow-hidden cursor-pointer rounded-md">
                      <Card className="w-full h-full relative group overflow-hidden border-slate-200 rounded-md">
                        <img 
                          src={photo.fileUrl!} 
                          loading="lazy"
                          alt={photo.content}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="w-3 h-3 text-white" />
                        </div>
                      </Card>
                    </ThumbnailWithDelete>
                  ))}
                  {incidentDocs.map((doc) => (
                    <ThumbnailWithDelete key={doc.id} onDelete={() => deleteMutation.mutate(doc.id)} onPreview={() => openPreview(doc)} className="w-10 h-10 overflow-hidden cursor-pointer rounded-md">
                      <Card className="w-full h-full relative group overflow-hidden border-slate-200 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-md">
                        <Paperclip className="w-4 h-4 text-slate-500" />
                      </Card>
                    </ThumbnailWithDelete>
                  ))}
                </div>
              );
            })()}
            
            {/* Sub-entries with connecting line - using grouped timeline items */}
            {timelineItems.length > 0 && (
              <div className="ml-4 border-l-2 border-slate-200 pl-3 space-y-2">
                {timelineItems.map((item) => {
                  if (item.type === 'chat_group') {
                    const isExpanded = expandedChatGroups.has(item.id);
                    const firstChat = item.chats[0];
                    const chatCount = item.chats.length;
                    
                    return (
                      <div key={item.id}>
                        {/* Collapsed view - show first chat with expand indicator */}
                        {!isExpanded && (
                          <Card 
                            className="p-2 cursor-pointer hover:bg-slate-50 bg-slate-50 border-slate-200"
                            onClick={() => toggleChatGroup(item.id)}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MessageSquare className="w-3 h-3 text-slate-900" />
                                <span className="font-medium text-slate-800 text-xs">Chat</span>
                                <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-xs">
                                  {chatCount} messages
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            </div>
                            <div className="text-slate-600 text-xs line-clamp-2 font-normal prose prose-slate max-w-none prose-p:my-0 bg-[var(--color-user-bubble)] border border-[var(--color-user-bubble-border)] p-2 rounded-lg mt-1">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({children}) => <span className="inline">{children}</span>,
                                  strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                  em: ({children}) => <em className="italic">{children}</em>,
                                  h1: ({children}) => <span className="font-bold">{children}</span>,
                                  h2: ({children}) => <span className="font-bold">{children}</span>,
                                  h3: ({children}) => <span className="font-bold">{children}</span>,
                                }}
                              >
                                {firstChat.content}
                              </ReactMarkdown>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {formatDateTime(firstChat.createdAt)}
                            </div>
                          </Card>
                        )}
                        
                        {/* Expanded view - show all chats with collapse header */}
                        {isExpanded && (
                          <div className="space-y-2">
                            <button 
                              onClick={() => toggleChatGroup(item.id)}
                              className="flex items-center justify-between w-full text-xs text-slate-500 hover:text-slate-700"
                            >
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                <span>Chat ({chatCount} messages)</span>
                              </div>
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            {item.chats.map((log) => (
                              <div key={log.id} id={`log-entry-${log.id}`} className={`transition-all duration-500 ${highlightedLogId === log.id ? 'ring-1 ring-blue-500 rounded-md bg-blue-50/20' : ''}`}>
                                <LogEntryCard 
                                  log={log}
                                  icon={MessageSquare}
                                  color="text-slate-900"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Single log entry (non-chat)
                  const log = item.log;
                  let icon = FileText;
                  let color = "text-slate-500";
                  
                  if (log.type === 'call') {
                    icon = Phone;
                    color = "text-blue-500";
                  } else if (log.type === 'text') {
                    icon = MessageSquare;
                    color = "text-green-500";
                  } else if (log.type === 'email') {
                    icon = Mail;
                    color = "text-purple-500";
                  } else if (log.type === 'photo') {
                    icon = ImageIcon;
                    color = "text-blue-500";
                  } else if (log.type === 'service') {
                    icon = Wrench;
                    color = "text-orange-500";
                  } else if (log.type === 'note') {
                    icon = FileText;
                    color = "text-slate-500";
                  }

                  const attachedPhotos = getAttachedPhotos(log);
                  const attachedDocs = getAttachedDocuments(log);
                  const hasAttachments = attachedPhotos.length > 0 || attachedDocs.length > 0;

                  return (
                    <div key={log.id}>
                      <LogEntryCard 
                        log={log}
                        icon={icon}
                        color={color}
                      />
                      {hasAttachments && (
                        <div className="ml-3 border-l-2 border-slate-200 pl-2 mt-0.5 flex flex-wrap gap-0.5">
                          {attachedPhotos.map((photo) => (
                            <ThumbnailWithDelete key={photo.id} onDelete={() => deleteMutation.mutate(photo.id)} onPreview={() => openPreview(photo)} className="w-10 h-10 overflow-hidden cursor-pointer rounded-md">
                              <Card className="w-full h-full relative group overflow-hidden border-slate-200 rounded-md">
                                <ImageWithFallback
                                  src={photo.fileUrl!}
                                  alt={photo.content}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ImageIcon className="w-3 h-3 text-white" />
                                </div>
                              </Card>
                            </ThumbnailWithDelete>
                          ))}
                          {attachedDocs.map((doc) => (
                            <ThumbnailWithDelete key={doc.id} onDelete={() => deleteMutation.mutate(doc.id)} onPreview={() => openPreview(doc)} className="w-10 h-10 overflow-hidden cursor-pointer rounded-md">
                              <Card className="w-full h-full relative group overflow-hidden border-slate-200 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-md">
                                <Paperclip className="w-4 h-4 text-slate-500" />
                              </Card>
                            </ThumbnailWithDelete>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Files Section */}
        {fileGroups.length > 0 && (
          <div>
            <h3 className="text-sm font-bold mb-3 uppercase tracking-wider pl-[20px] pr-[20px] text-[#0f172a]">Files</h3>
            <div className="space-y-1">
              {fileGroups.map((group) => {
                const isExpanded = expandedFileGroups.has(group.id);
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => toggleFileGroup(group.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <GroupIcon className={`w-4 h-4 ${group.color} shrink-0`} />
                      <span className="text-sm font-medium text-slate-700 truncate flex-1 text-left">{group.label}</span>
                      <span className="text-xs text-slate-400 shrink-0">{group.files.length}</span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-2 bg-slate-50">
                        <div className="grid grid-cols-4 gap-1.5">
                          {group.files.map((file) => (
                            file.type === 'photo' ? (
                              <ThumbnailWithDelete key={file.id} onDelete={() => deleteMutation.mutate(file.id)} onPreview={() => openPreview(file)} className="aspect-square overflow-hidden cursor-pointer rounded-md">
                                <Card className="w-full h-full relative group overflow-hidden border-slate-200 rounded-md">
                                  <ImageWithFallback
                                    src={file.fileUrl!}
                                    alt={file.content}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ImageIcon className="w-3 h-3 text-white" />
                                  </div>
                                </Card>
                              </ThumbnailWithDelete>
                            ) : (
                              <ThumbnailWithDelete key={file.id} onDelete={() => deleteMutation.mutate(file.id)} onPreview={() => openPreview(file)} className="aspect-square overflow-hidden cursor-pointer rounded-md">
                                <Card className="w-full h-full flex items-center justify-center hover:bg-slate-50 border-slate-200 rounded-md">
                                  <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
                                </Card>
                              </ThumbnailWithDelete>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div 
      className="flex h-[calc(100vh-64px)] bg-slate-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleDocUpload}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={(e) => {
          const files = e.target.files;
          if (!files) return;
          Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
              handlePhotoUpload({ target: { files: [file] } } as any);
            } else {
              handleDocUpload({ target: { files: [file] } } as any);
            }
          });
          e.target.value = '';
        }}
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as any)}
      />
      <input
        type="file"
        ref={generalFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.type.startsWith('image/')) {
            handlePhotoUpload(e);
          } else {
            handleDocUpload(e);
          }
          e.target.value = '';
        }}
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden"
      />
      {/* Edit Incident Dialog - rendered at root level to avoid mobile drawer conflicts */}
      <Dialog open={editIncidentOpen} onOpenChange={setEditIncidentOpen}>
        <DialogContent aria-describedby={undefined} className="w-[90%] rounded-xl sm:max-w-[425px] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] transition-transform duration-200 pt-[35px] pb-[35px]">
          <div className="space-y-4 pt-[8px] pb-[8px]">
            <Input 
              placeholder="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-[6px] mb-[6px] placeholder:text-slate-400"
            />
            <Textarea 
              placeholder="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="min-h-[140px] mt-[5px] mb-[5px] placeholder:text-slate-400"
            />
            {(() => {
              const editPhotos = logs?.filter(l => l.type === 'photo' && (l.metadata as any)?.category === 'incident_photo' && l.fileUrl) || [];
              const logDocCategories = ['call_document', 'text_document', 'email_document', 'service_document'];
              const editDocs = logs?.filter(l => {
                if (l.type !== 'document' || !l.fileUrl) return false;
                const cat = (l.metadata as any)?.category;
                return cat === 'incident_document' || !logDocCategories.includes(cat);
              }) || [];
              const editFiles = [...editPhotos, ...editDocs];
              if (editFiles.length === 0) return null;
              return (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2">Attached Files</div>
                  <div className="flex flex-wrap gap-2">
                    {editPhotos.map((photo) => (
                      <ThumbnailWithDelete key={photo.id} onDelete={() => deleteMutation.mutate(photo.id)} onPreview={() => openPreview(photo)} className="w-14 h-14 overflow-hidden cursor-pointer rounded-lg">
                        <div
                          className="w-full h-full relative group overflow-hidden rounded-lg border border-slate-200"
                          data-testid={`edit-dialog-photo-${photo.id}`}
                        >
                          <img 
                            src={photo.fileUrl!} 
                            loading="lazy"
                            alt={photo.content}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </ThumbnailWithDelete>
                    ))}
                    {editDocs.map((doc) => (
                      <ThumbnailWithDelete key={doc.id} onDelete={() => deleteMutation.mutate(doc.id)} onPreview={() => openPreview(doc)} className="w-14 h-14 overflow-hidden cursor-pointer rounded-lg">
                        <div
                          className="w-full h-full flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                          title={doc.content}
                          data-testid={`edit-dialog-doc-${doc.id}`}
                        >
                          <Paperclip className="w-4 h-4 text-slate-500" />
                        </div>
                      </ThumbnailWithDelete>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => generalFileInputRef.current?.click()}
                className="w-full justify-start"
                disabled={uploadFileMutation.isPending}
                data-testid="button-edit-incident-upload-file"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => folderInputRef.current?.click()}
                className="w-full justify-start"
                disabled={uploadFileMutation.isPending}
                data-testid="button-edit-incident-upload-folder"
              >
                <FolderUp className="w-4 h-4 mr-2" />
                Upload Folder
              </Button>
            </div>
            <Button 
              onClick={() => updateIncidentMutation.mutate()} 
              className="w-full"
              disabled={updateIncidentMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Mobile drawer overlay */}
      {mobileDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => { setMobileDrawerOpen(false); setDrawerOpenedByTour(false); }}
        />
      )}
      {/* Mobile drawer */}
      <div className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-80 bg-white z-50 transform transition-transform duration-300 ease-out md:hidden flex flex-col shadow-xl rounded-r-xl ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center p-4 border-b shrink-0 pt-[1px] pb-[1px]">
          <h2 className="font-bold text-lg pt-[10px] pb-[10px]">Case Details</h2>
          <Button variant="ghost" size="icon" onClick={() => { setMobileDrawerOpen(false); setDrawerOpenedByTour(false); }}>
            <X className="w-5 h-5" />
          </Button>
        </div>
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide pb-32">
          <SidebarContent />
        </div>
      </div>
      {/* Mobile edge indicator - swipe hint */}
      <div 
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 md:hidden bg-white border border-slate-300 px-1 py-4 rounded-r-lg shadow-md flex items-center cursor-pointer"
        onClick={() => { setMobileDrawerOpen(true); setDrawerOpenedByTour(false); }}
      >
        <span className="text-black text-xs font-medium" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Open</span>
      </div>
      {/* Desktop Sidebar / Case Info */}
      <div className="w-96 border-r border-slate-200 bg-white p-6 hidden md:block overflow-y-auto pl-[20px] pr-[20px]">
        <div className="mb-6 border border-slate-300 rounded-lg p-4">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => toggleStatusMutation.mutate()}
              disabled={toggleStatusMutation.isPending}
              className={`px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors ${
                incident.status === 'open'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
              data-testid="status-toggle"
            >
              <Clock className="w-3 h-3" />
              {incident.status === 'open' ? 'Open' : 'Closed'}
            </button>
          </div>
          <div className="flex items-center gap-1 mb-3">
            <Button 
              variant="ghost"
              size="sm"
              onClick={exportToPDF}
              disabled={isExporting}
              className="text-slate-600 hover:text-green-700 h-7 px-2 text-xs border border-slate-300 bg-[#4d5e700f]"
              data-testid="button-export-pdf-desktop"
            >
              <Download className={`w-3.5 h-3.5 mr-1 ${isExporting ? 'animate-pulse' : ''}`} />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={triggerLitigationReview}
              disabled={!canRunAnalysis}
              className={`h-7 px-2 text-xs border border-slate-300 ${canRunAnalysis ? 'text-slate-600 hover:text-blue-700 bg-[#4d5e700f]' : 'text-slate-400 bg-slate-100 opacity-60 cursor-not-allowed'}`}
              title={!hasEnoughEvidence ? `Add at least ${MIN_EVIDENCE_COUNT} evidence entries to unlock` : hasReachedDailyLimit ? 'Daily limit reached — try again tomorrow' : 'Run AI case analysis'}
              data-testid="button-ai-analysis-desktop"
            >
              <Bot className={`w-3.5 h-3.5 mr-1 ${isAnalyzing ? 'animate-pulse' : ''}`} />
              {getAnalysisButtonLabel()}
            </Button>
          </div>
          <AnalysisUnlockChecklist />
          <h2 className="text-xl font-bold text-slate-900 mb-2 mt-3">{incident.title}</h2>
          <p className="text-sm text-slate-600 mb-2">{incident.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDateTime(incident.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Edit Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                onClick={() => setEditIncidentOpen(true)}
                data-testid="button-edit-incident"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              
              {/* Delete Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete This Case?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the case and all its evidence. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteIncidentMutation.mutate()} className="bg-red-600 hover:bg-red-700">
                      Delete Case
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Add Log section */}
        <div className="space-y-2 mt-2" data-testid="log-buttons">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 bg-[#4d5e700f] border-slate-300"
            onClick={() => setLogCallOpen(true)}
          >
            <Phone className="w-4 h-4 text-green-500" />
            <span>Record Call</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 bg-[#4d5e700f] border-slate-300"
            onClick={() => setLogTextOpen(true)}
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Record Text</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 bg-[#4d5e700f] border-slate-300"
            onClick={() => setLogEmailOpen(true)}
          >
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Record Email</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 bg-[#4d5e700f] border-slate-300"
            onClick={() => setLogServiceOpen(true)}
          >
            <Wrench className="w-4 h-4 text-orange-500" />
            <span>Record Service Request</span>
          </Button>
        </div>

        <div className="space-y-6 mt-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Timeline</h3>
            <div className="space-y-2">
              {/* Master Bubble - shows the incident itself */}
              {incident && (
                <div className="bg-white border-2 border-input rounded-lg p-3 shadow-md">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{incident.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {incident.status === 'open' ? (
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-bold uppercase flex items-center gap-0.5 shrink-0">
                          <Clock className="w-2.5 h-2.5" /> Open
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-bold uppercase flex items-center gap-0.5 shrink-0">
                          <Clock className="w-2.5 h-2.5" /> Closed
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-1">{incident.description}</p>
                  <div className="text-xs text-slate-400">
                    {format(new Date(incident.createdAt), "MMM d, yyyy  h:mm a")}
                  </div>
                </div>
              )}
              
              {/* Sub-entries with connecting line - includes incident photos and all logs */}
              {((() => {
                const incidentPhotos = logs?.filter(l => l.type === 'photo' && (l.metadata as any)?.category === 'incident_photo') || [];
                return incidentPhotos.length > 0 || timelineItems.length > 0;
              })()) && (
                <div className="ml-4 border-l-2 border-slate-200 pl-3 space-y-2">
                  {/* Incident photos first - wrapped in nested container to match email attachment width */}
                  {(() => {
                    const incidentPhotos = logs?.filter(l => l.type === 'photo' && (l.metadata as any)?.category === 'incident_photo') || [];
                    if (incidentPhotos.length === 0) return null;
                    return (
                      <div className="ml-4 border-l-2 border-slate-200 pl-3 mt-1 flex flex-wrap gap-0.5">
                        {incidentPhotos.map((photo) => (
                          <ThumbnailWithDelete
                            key={photo.id}
                            onDelete={() => deleteMutation.mutate(photo.id)}
                            onPreview={() => openPreview(photo)}
                            className="w-10 h-10 overflow-hidden cursor-pointer rounded-md"
                          >
                            <Card className="w-full h-full relative group overflow-hidden border-slate-200 rounded-md">
                              <img
                                src={photo.fileUrl!}
                                loading="lazy"
                                alt={photo.content}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ImageIcon className="w-3 h-3 text-white" />
                              </div>
                            </Card>
                          </ThumbnailWithDelete>
                        ))}
                      </div>
                    );
                  })()}
                  {/* Timeline logs - grouped by chat */}
                  {timelineItems.map((item) => {
                    if (item.type === 'chat_group') {
                      const isExpanded = expandedChatGroups.has(item.id);
                      const firstChat = item.chats[0];
                      const chatCount = item.chats.length;
                      
                      return (
                        <div key={item.id}>
                          {!isExpanded && (
                            <Card 
                              className="p-2 cursor-pointer hover:bg-slate-50 bg-slate-50 border-slate-200"
                              onClick={() => toggleChatGroup(item.id)}
                            >
                              <div className="flex items-center justify-between gap-1.5 mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <MessageSquare className="w-3 h-3 text-slate-900" />
                                  <span className="font-medium text-slate-800 text-xs">Chat</span>
                                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-xs">
                                    {chatCount} messages
                                  </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                              </div>
                              <div className="text-slate-600 text-xs line-clamp-2 font-normal prose prose-slate max-w-none prose-p:my-0 bg-[var(--color-user-bubble)] border border-[var(--color-user-bubble-border)] p-2 rounded-lg mt-1">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({children}) => <span className="inline">{children}</span>,
                                    strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                    em: ({children}) => <em className="italic">{children}</em>,
                                    h1: ({children}) => <span className="font-bold">{children}</span>,
                                    h2: ({children}) => <span className="font-bold">{children}</span>,
                                    h3: ({children}) => <span className="font-bold">{children}</span>,
                                  }}
                                >
                                  {firstChat.content}
                                </ReactMarkdown>
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                {formatDateTime(firstChat.createdAt)}
                              </div>
                            </Card>
                          )}
                          
                          {isExpanded && (
                            <div className="space-y-2">
                              <button 
                                onClick={() => toggleChatGroup(item.id)}
                                className="flex items-center justify-between w-full text-xs text-slate-500 hover:text-slate-700"
                              >
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>Chat ({chatCount} messages)</span>
                                </div>
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              {item.chats.map((log) => (
                                <div key={log.id} id={`log-entry-${log.id}`} className={`transition-all duration-500 ${highlightedLogId === log.id ? 'ring-1 ring-blue-500 rounded-md bg-blue-50/20' : ''}`}>
                                  <LogEntryCard 
                                    log={log}
                                    icon={MessageSquare}
                                    color="text-slate-900"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    const log = item.log;
                    let icon = FileText;
                    let color = "text-slate-500";
                    
                    if (log.type === 'call') {
                      icon = Phone;
                      color = "text-blue-500";
                    } else if (log.type === 'text') {
                      icon = MessageSquare;
                      color = "text-green-500";
                    } else if (log.type === 'email') {
                      icon = Mail;
                      color = "text-purple-500";
                    } else if (log.type === 'photo') {
                      icon = ImageIcon;
                      color = "text-blue-500";
                    } else if (log.type === 'service') {
                      icon = Wrench;
                      color = "text-orange-500";
                    } else if (log.type === 'note') {
                      icon = FileText;
                      color = "text-slate-500";
                    }

                    const attachedPhotos = getAttachedPhotos(log);
                    const attachedDocs = getAttachedDocuments(log);
                    const hasAttachments = attachedPhotos.length > 0 || attachedDocs.length > 0;

                    return (
                      <div key={log.id}>
                        <LogEntryCard 
                          log={log}
                          icon={icon}
                          color={color}
                        />
                        {hasAttachments && (
                          <div className="ml-3 border-l-2 border-slate-200 pl-2 mt-0.5 flex flex-wrap gap-0.5">
                            {attachedPhotos.map((photo) => (
                            <ThumbnailWithDelete key={photo.id} onDelete={() => deleteMutation.mutate(photo.id)} onPreview={() => openPreview(photo)} className="w-10 h-10 overflow-hidden cursor-pointer rounded-md">
                              <Card className="w-full h-full relative group overflow-hidden border-slate-200 rounded-md">
                                <ImageWithFallback
                                  src={photo.fileUrl!}
                                  alt={photo.content}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ImageIcon className="w-3 h-3 text-white" />
                                </div>
                              </Card>
                            </ThumbnailWithDelete>
                            ))}
                            {attachedDocs.map((doc) => (
                            <ThumbnailWithDelete key={doc.id} onDelete={() => deleteMutation.mutate(doc.id)} onPreview={() => openPreview(doc)} className="w-10 h-10 overflow-hidden cursor-pointer rounded-md">
                              <Card className="w-full h-full relative group overflow-hidden border-slate-200 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-md">
                                <Paperclip className="w-4 h-4 text-slate-500" />
                              </Card>
                            </ThumbnailWithDelete>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {fileGroups.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Files</h3>
              <div className="space-y-1">
                {fileGroups.map((group) => {
                  const isExpanded = expandedFileGroups.has(group.id);
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => toggleFileGroup(group.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors"
                        data-testid={`btn-toggle-file-group-${group.id}`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <GroupIcon className={`w-4 h-4 ${group.color} shrink-0`} />
                        <span className="text-sm font-medium text-slate-700 truncate flex-1 text-left">{group.label}</span>
                        <span className="text-xs text-slate-400 shrink-0">{group.files.length}</span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-slate-100 p-2 bg-slate-50">
                          <div className="grid grid-cols-4 gap-1.5">
                            {group.files.map((file) => (
                              file.type === 'photo' ? (
                                <ThumbnailWithDelete key={file.id} onDelete={() => deleteMutation.mutate(file.id)} onPreview={() => openPreview(file)} className="aspect-square overflow-hidden cursor-pointer rounded-md">
                                  <Card className="w-full h-full relative group overflow-hidden border-slate-200 rounded-md" data-testid={`img-file-${file.id}`}>
                                    <img 
                                      src={file.fileUrl!} 
                                      loading="lazy"
                                      alt={file.content}
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ImageIcon className="w-3 h-3 text-white" />
                                    </div>
                                  </Card>
                                </ThumbnailWithDelete>
                              ) : (
                                <ThumbnailWithDelete key={file.id} onDelete={() => deleteMutation.mutate(file.id)} onPreview={() => openPreview(file)} className="aspect-square overflow-hidden cursor-pointer rounded-md">
                                  <Card className="w-full h-full flex items-center justify-center hover:bg-slate-50 border-slate-200 rounded-md" data-testid={`doc-file-${file.id}`}>
                                    <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
                                  </Card>
                                </ThumbnailWithDelete>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Edit Log Dialog */}
      <Dialog open={editLogId !== null && !chatLogs.some(l => l.id === editLogId)} onOpenChange={(open) => { if (!open) { setEditLogId(null); setEditLogPhoto(null); setEditLogAttachments([]); setShowEditEvidencePicker(false); } }}>
        <DialogContent aria-describedby={undefined} className="w-[90%] rounded-xl py-[45px]">
          <div className="space-y-4">
            <Textarea 
              value={editLogContent}
              onChange={(e) => setEditLogContent(e.target.value)}
              className="min-h-[140px]"
            />
            <div className="space-y-2">
              {/* Show existing attachments inline with remove buttons */}
              {(editLogAttachments.length > 0 || (editLogPhoto && !editLogAttachments.includes(editLogPhoto.fileUrl!))) && (
                <div className="flex gap-2 flex-wrap flex-row">
                  {/* Legacy single photo first if exists */}
                  {editLogPhoto && !editLogAttachments.includes(editLogPhoto.fileUrl!) && (
                    <div className="relative group">
                      <img 
                        src={editLogPhoto.fileUrl!} 
                        loading="lazy"
                        alt="Attached photo"
                        className="w-12 h-12 object-cover rounded border border-slate-200 cursor-pointer"
                        onClick={() => openPreview(editLogPhoto)}
                      />
                      <button
                        onClick={() => {
                          if (editLogPhoto.id) {
                            deleteMutation.mutate(editLogPhoto.id);
                            setEditLogPhoto(null);
                          }
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {/* Attachments in order added */}
                  {editLogAttachments.map((url, idx) => {
                    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    return (
                      <div key={idx} className="relative group">
                        {isImage ? (
                          <img 
                            src={url} 
                            loading="lazy"
                            alt={`Attachment ${idx + 1}`}
                            className="w-12 h-12 object-cover rounded border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center rounded border border-slate-200 bg-slate-50">
                            <Paperclip className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <button 
                          onClick={() => setEditLogAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`remove-edit-attachment-modal-${idx}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Evidence picker for modal */}
              {showEditEvidencePicker && (() => {
                const photoTypes = ['photo', 'call_photo', 'text_photo', 'email_photo', 'chat_photo', 'service_photo'];
                const photoLogs = logs?.filter(l => photoTypes.includes(l.type) && l.fileUrl) || [];
                return (
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
                    <div className="text-xs text-slate-500 mb-1">Select from evidence:</div>
                    <div className="flex gap-1 flex-wrap">
                      {photoLogs.map(l => (
                        <button 
                          key={l.id} 
                          onClick={() => {
                            if (!editLogAttachments.includes(l.fileUrl!)) {
                              setEditLogAttachments(prev => [...prev, l.fileUrl!]);
                            }
                            setShowEditEvidencePicker(false);
                          }}
                          className="relative"
                          data-testid={`modal-evidence-picker-${l.id}`}
                        >
                          <img 
                            src={l.fileUrl!} 
                            loading="lazy"
                            alt="Evidence" 
                            className="w-10 h-10 object-cover rounded border border-slate-300 hover:border-blue-500 transition-colors"
                          />
                        </button>
                      ))}
                      {photoLogs.length === 0 && (
                        <div className="text-xs text-slate-400">No photos in evidence</div>
                      )}
                    </div>
                  </div>
                );
              })()}
              
              {/* Stacked attachment buttons */}
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={editPhotoInputRef} 
                  onChange={handleEditPhotoUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt" 
                  multiple
                  className="hidden"
                />
                <input 
                  type="file" 
                  ref={editFolderInputRef} 
                  onChange={handleEditPhotoUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt" 
                  multiple
                  className="hidden"
                  {...({ webkitdirectory: "", directory: "" } as any)}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => editPhotoInputRef.current?.click()}
                  className="w-full justify-start"
                  data-testid="button-modal-upload-file"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => editFolderInputRef.current?.click()}
                  className="w-full justify-start"
                  data-testid="button-modal-upload-folder"
                >
                  <FolderUp className="w-4 h-4 mr-2" />
                  Upload Folder
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowEditEvidencePicker(!showEditEvidencePicker)}
                  className="w-full justify-start"
                  data-testid="button-modal-pick-evidence"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  From Evidence
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Severity</Label>
              <div className="flex gap-1">
                {SEVERITY_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEditLogSeverity(level)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${editLogSeverity === level 
                      ? level === 'critical' ? 'bg-red-100 border-red-300 text-red-700' 
                        : level === 'important' ? 'bg-amber-100 border-amber-300 text-amber-700' 
                        : 'bg-slate-100 border-slate-300 text-slate-600'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    data-testid={`severity-edit-${level}`}
                  >
                    {level === 'critical' ? <AlertTriangle className="w-3 h-3" /> : level === 'important' ? <Info className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => editLogId && updateLogMutation.mutate({ logId: editLogId, content: editLogContent, severity: editLogSeverity })} 
              className="w-full"
              disabled={updateLogMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Log Call Dialog */}
      <Dialog open={logCallOpen} onOpenChange={(open) => { setLogCallOpen(open); if (open) { setLogSeverity(DEFAULT_SEVERITY_BY_TYPE['call']); } if (!open) { setLogPhotoFiles([]); setLogDocFiles([]); setLogTitle(""); setLogNotes(""); setLogSeverity('routine'); setShowLogEvidencePicker(false); } }}>
        <DialogContent aria-describedby={undefined} className="w-[90%] rounded-xl sm:max-w-[425px] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] transition-transform duration-200 pt-[35px] pb-[35px]">
          <div className="space-y-4 pt-[8px] pb-[8px]">
            <div className="space-y-2">
              <Input 
                placeholder="Call Title"
                value={logTitle}
                onChange={(e) => setLogTitle(e.target.value)}
                className="mt-[6px] mb-[6px] placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Textarea 
                placeholder="Call notes"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="min-h-[140px] mt-[5px] mb-[5px] placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              {logPhotoFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {logPhotoFiles.map((file, idx) => (
                    <div key={idx} className="relative group">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="" className="w-12 h-12 object-cover rounded border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center rounded border border-slate-200 bg-slate-50">
                          <Paperclip className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeLogPhoto(idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        data-testid={`remove-log-file-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={logPhotoInputRef}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleLogPhotoAdd}
                  className="hidden"
                />
                <input 
                  type="file" 
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleLogPhotoAdd}
                  className="hidden"
                  id="log-call-folder-input"
                  {...({ webkitdirectory: "", directory: "" } as any)}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => logPhotoInputRef.current?.click()}
                  className="w-full justify-start"
                  data-testid="button-log-call-upload-file"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('log-call-folder-input')?.click()}
                  className="w-full justify-start"
                  data-testid="button-log-call-upload-folder"
                >
                  <FolderUp className="w-4 h-4 mr-2" />
                  Upload Folder
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowLogEvidencePicker(!showLogEvidencePicker)}
                  className="w-full justify-start"
                  data-testid="button-log-call-pick-evidence"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  From Evidence
                </Button>
              </div>
              {showLogEvidencePicker && (() => {
                const photoTypes = ['photo', 'call_photo', 'text_photo', 'email_photo', 'chat_photo', 'service_photo'];
                const photoLogs = logs?.filter(l => photoTypes.includes(l.type) && l.fileUrl) || [];
                return (
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
                    <div className="text-xs text-slate-500 mb-1">Select from evidence:</div>
                    <div className="flex gap-1 flex-wrap">
                      {photoLogs.map(l => (
                        <button 
                          key={l.id} 
                          onClick={async () => {
                            const response = await fetch(l.fileUrl!);
                            const blob = await response.blob();
                            const file = new File([blob], `evidence-${l.id}.jpg`, { type: blob.type });
                            setLogPhotoFiles(prev => [...prev, file]);
                            setShowLogEvidencePicker(false);
                          }}
                          className="relative"
                          data-testid={`log-evidence-picker-${l.id}`}
                        >
                          <img 
                            src={l.fileUrl!} 
                            loading="lazy"
                            alt="Evidence" 
                            className="w-10 h-10 object-cover rounded border border-slate-300 hover:border-blue-500 transition-colors"
                          />
                        </button>
                      ))}
                      {photoLogs.length === 0 && (
                        <div className="text-xs text-slate-400">No photos in evidence</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Severity</Label>
              <div className="flex gap-1">
                {SEVERITY_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLogSeverity(level)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${logSeverity === level 
                      ? level === 'critical' ? 'bg-red-100 border-red-300 text-red-700' 
                        : level === 'important' ? 'bg-amber-100 border-amber-300 text-amber-700' 
                        : 'bg-slate-100 border-slate-300 text-slate-600'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    data-testid={`severity-call-${level}`}
                  >
                    {level === 'critical' ? <AlertTriangle className="w-3 h-3" /> : level === 'important' ? <Info className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => handleLogSubmit('call')} 
              className="w-full"
              disabled={createLogWithPhotoMutation.isPending}
            >
              Save Call Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Log Text Dialog */}
      <Dialog open={logTextOpen} onOpenChange={(open) => { setLogTextOpen(open); if (open) { setLogSeverity(DEFAULT_SEVERITY_BY_TYPE['text']); } if (!open) { setLogPhotoFiles([]); setLogDocFiles([]); setLogTitle(""); setLogNotes(""); setLogSeverity('routine'); setShowLogEvidencePicker(false); } }}>
        <DialogContent aria-describedby={undefined} className="w-[90%] rounded-xl sm:max-w-[425px] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] transition-transform duration-200 pt-[35px] pb-[35px]">
          <div className="space-y-4 pt-[8px] pb-[8px]">
            <div className="space-y-2">
              <Input 
                placeholder="Text Title"
                value={logTitle}
                onChange={(e) => setLogTitle(e.target.value)}
                className="mt-[6px] mb-[6px] placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Textarea 
                placeholder="Text message"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="min-h-[140px] mt-[5px] mb-[5px] placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              {logPhotoFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {logPhotoFiles.map((file, idx) => (
                    <div key={idx} className="relative group">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="" className="w-12 h-12 object-cover rounded border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center rounded border border-slate-200 bg-slate-50">
                          <Paperclip className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeLogPhoto(idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        data-testid={`remove-log-file-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={logPhotoInputRef}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleLogPhotoAdd}
                  className="hidden"
                />
                <input 
                  type="file" 
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleLogPhotoAdd}
                  className="hidden"
                  id="log-text-folder-input"
                  {...({ webkitdirectory: "", directory: "" } as any)}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => logPhotoInputRef.current?.click()}
                  className="w-full justify-start"
                  data-testid="button-log-text-upload-file"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('log-text-folder-input')?.click()}
                  className="w-full justify-start"
                  data-testid="button-log-text-upload-folder"
                >
                  <FolderUp className="w-4 h-4 mr-2" />
                  Upload Folder
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowLogEvidencePicker(!showLogEvidencePicker)}
                  className="w-full justify-start"
                  data-testid="button-log-text-pick-evidence"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  From Evidence
                </Button>
              </div>
              {showLogEvidencePicker && (() => {
                const photoTypes = ['photo', 'call_photo', 'text_photo', 'email_photo', 'chat_photo', 'service_photo'];
                const photoLogs = logs?.filter(l => photoTypes.includes(l.type) && l.fileUrl) || [];
                return (
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
                    <div className="text-xs text-slate-500 mb-1">Select from evidence:</div>
                    <div className="flex gap-1 flex-wrap">
                      {photoLogs.map(l => (
                        <button 
                          key={l.id} 
                          onClick={async () => {
                            const response = await fetch(l.fileUrl!);
                            const blob = await response.blob();
                            const file = new File([blob], `evidence-${l.id}.jpg`, { type: blob.type });
                            setLogPhotoFiles(prev => [...prev, file]);
                            setShowLogEvidencePicker(false);
                          }}
                          className="relative"
                          data-testid={`log-text-evidence-picker-${l.id}`}
                        >
                          <img 
                            src={l.fileUrl!} 
                            loading="lazy"
                            alt="Evidence" 
                            className="w-10 h-10 object-cover rounded border border-slate-300 hover:border-blue-500 transition-colors"
                          />
                        </button>
                      ))}
                      {photoLogs.length === 0 && (
                        <div className="text-xs text-slate-400">No photos in evidence</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Severity</Label>
              <div className="flex gap-1">
                {SEVERITY_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLogSeverity(level)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${logSeverity === level 
                      ? level === 'critical' ? 'bg-red-100 border-red-300 text-red-700' 
                        : level === 'important' ? 'bg-amber-100 border-amber-300 text-amber-700' 
                        : 'bg-slate-100 border-slate-300 text-slate-600'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    data-testid={`severity-text-${level}`}
                  >
                    {level === 'critical' ? <AlertTriangle className="w-3 h-3" /> : level === 'important' ? <Info className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => handleLogSubmit('text')} 
              className="w-full"
              disabled={createLogWithPhotoMutation.isPending}
            >
              Save Text Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Log Email Dialog */}
      <Dialog open={logEmailOpen} onOpenChange={(open) => { setLogEmailOpen(open); if (open) { setLogSeverity(DEFAULT_SEVERITY_BY_TYPE['email']); } if (!open) { setLogPhotoFiles([]); setLogDocFiles([]); setLogTitle(""); setLogNotes(""); setLogSeverity('routine'); setShowLogEvidencePicker(false); } }}>
        <DialogContent aria-describedby={undefined} className="w-[90%] rounded-xl sm:max-w-[425px] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] transition-transform duration-200 pt-[35px] pb-[35px]">
          <div className="space-y-4 pt-[8px] pb-[8px]">
            <div className="space-y-2">
              <Input 
                placeholder="Email Title"
                value={logTitle}
                onChange={(e) => setLogTitle(e.target.value)}
                className="mt-[6px] mb-[6px] placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Textarea 
                placeholder="Email summary"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="min-h-[140px] mt-[5px] mb-[5px] placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              {logPhotoFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {logPhotoFiles.map((file, idx) => (
                    <div key={idx} className="relative group">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="" className="w-12 h-12 object-cover rounded border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center rounded border border-slate-200 bg-slate-50">
                          <Paperclip className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeLogPhoto(idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        data-testid={`remove-log-file-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={logPhotoInputRef}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleLogPhotoAdd}
                  className="hidden"
                />
                <input 
                  type="file" 
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleLogPhotoAdd}
                  className="hidden"
                  id="log-email-folder-input"
                  {...({ webkitdirectory: "", directory: "" } as any)}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => logPhotoInputRef.current?.click()}
                  className="w-full justify-start"
                  data-testid="button-log-email-upload-file"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('log-email-folder-input')?.click()}
                  className="w-full justify-start"
                  data-testid="button-log-email-upload-folder"
                >
                  <FolderUp className="w-4 h-4 mr-2" />
                  Upload Folder
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowLogEvidencePicker(!showLogEvidencePicker)}
                  className="w-full justify-start"
                  data-testid="button-log-email-pick-evidence"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  From Evidence
                </Button>
              </div>
              {showLogEvidencePicker && (() => {
                const photoTypes = ['photo', 'call_photo', 'text_photo', 'email_photo', 'chat_photo', 'service_photo'];
                const photoLogs = logs?.filter(l => photoTypes.includes(l.type) && l.fileUrl) || [];
                return (
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
                    <div className="text-xs text-slate-500 mb-1">Select from evidence:</div>
                    <div className="flex gap-1 flex-wrap">
                      {photoLogs.map(l => (
                        <button 
                          key={l.id} 
                          onClick={async () => {
                            const response = await fetch(l.fileUrl!);
                            const blob = await response.blob();
                            const file = new File([blob], `evidence-${l.id}.jpg`, { type: blob.type });
                            setLogPhotoFiles(prev => [...prev, file]);
                            setShowLogEvidencePicker(false);
                          }}
                          className="relative"
                          data-testid={`log-email-evidence-picker-${l.id}`}
                        >
                          <img 
                            src={l.fileUrl!} 
                            loading="lazy"
                            alt="Evidence" 
                            className="w-10 h-10 object-cover rounded border border-slate-300 hover:border-blue-500 transition-colors"
                          />
                        </button>
                      ))}
                      {photoLogs.length === 0 && (
                        <div className="text-xs text-slate-400">No photos in evidence</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Severity</Label>
              <div className="flex gap-1">
                {SEVERITY_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLogSeverity(level)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${logSeverity === level 
                      ? level === 'critical' ? 'bg-red-100 border-red-300 text-red-700' 
                        : level === 'important' ? 'bg-amber-100 border-amber-300 text-amber-700' 
                        : 'bg-slate-100 border-slate-300 text-slate-600'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    data-testid={`severity-email-${level}`}
                  >
                    {level === 'critical' ? <AlertTriangle className="w-3 h-3" /> : level === 'important' ? <Info className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => handleLogSubmit('email')} 
              className="w-full"
              disabled={createLogWithPhotoMutation.isPending}
            >
              Save Email Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Log Service Request Dialog */}
      <Dialog open={logServiceOpen} onOpenChange={(open) => { setLogServiceOpen(open); if (open) { setLogSeverity(DEFAULT_SEVERITY_BY_TYPE['service']); } if (!open) { setLogPhotoFiles([]); setLogDocFiles([]); setLogTitle(""); setLogNotes(""); setLogSeverity('routine'); setShowLogEvidencePicker(false); } }}>
        <DialogContent aria-describedby={undefined} className="w-[90%] rounded-xl sm:max-w-[425px] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] transition-transform duration-200 pt-[35px] pb-[35px]">
          <div className="space-y-4 pt-[8px] pb-[8px]">
            <div className="space-y-2">
              <Input 
                placeholder="Service Request Title"
                value={logTitle}
                onChange={(e) => setLogTitle(e.target.value)}
                className="mt-[6px] mb-[6px] placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Textarea 
                placeholder="Service request details"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="min-h-[140px] mt-[5px] mb-[5px] placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              {logPhotoFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {logPhotoFiles.map((file, idx) => (
                    <div key={idx} className="relative group">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="" className="w-12 h-12 object-cover rounded border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center rounded border border-slate-200 bg-slate-50">
                          <Paperclip className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeLogPhoto(idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        data-testid={`remove-log-service-file-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={logPhotoInputRef}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleLogPhotoAdd}
                  className="hidden"
                />
                <input 
                  type="file" 
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleLogPhotoAdd}
                  className="hidden"
                  id="log-service-folder-input"
                  {...({ webkitdirectory: "", directory: "" } as any)}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => logPhotoInputRef.current?.click()}
                  className="w-full justify-start"
                  data-testid="button-log-service-upload-file"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('log-service-folder-input')?.click()}
                  className="w-full justify-start"
                  data-testid="button-log-service-upload-folder"
                >
                  <FolderUp className="w-4 h-4 mr-2" />
                  Upload Folder
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowLogEvidencePicker(!showLogEvidencePicker)}
                  className="w-full justify-start"
                  data-testid="button-log-service-pick-evidence"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  From Evidence
                </Button>
              </div>
              {showLogEvidencePicker && (() => {
                const photoTypes = ['photo', 'call_photo', 'text_photo', 'email_photo', 'chat_photo', 'service_photo'];
                const photoLogs = logs?.filter(l => photoTypes.includes(l.type) && l.fileUrl) || [];
                return (
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
                    <div className="text-xs text-slate-500 mb-1">Select from evidence:</div>
                    <div className="flex gap-1 flex-wrap">
                      {photoLogs.map(l => (
                        <button 
                          key={l.id} 
                          onClick={async () => {
                            const response = await fetch(l.fileUrl!);
                            const blob = await response.blob();
                            const file = new File([blob], `evidence-${l.id}.jpg`, { type: blob.type });
                            setLogPhotoFiles(prev => [...prev, file]);
                            setShowLogEvidencePicker(false);
                          }}
                          className="relative"
                          data-testid={`log-service-evidence-picker-${l.id}`}
                        >
                          <img 
                            src={l.fileUrl!} 
                            loading="lazy"
                            alt="Evidence" 
                            className="w-10 h-10 object-cover rounded border border-slate-300 hover:border-blue-500 transition-colors"
                          />
                        </button>
                      ))}
                      {photoLogs.length === 0 && (
                        <div className="text-xs text-slate-400">No photos in evidence</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Severity</Label>
              <div className="flex gap-1">
                {SEVERITY_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLogSeverity(level)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${logSeverity === level 
                      ? level === 'critical' ? 'bg-red-100 border-red-300 text-red-700' 
                        : level === 'important' ? 'bg-amber-100 border-amber-300 text-amber-700' 
                        : 'bg-slate-100 border-slate-300 text-slate-600'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    data-testid={`severity-service-${level}`}
                  >
                    {level === 'critical' ? <AlertTriangle className="w-3 h-3" /> : level === 'important' ? <Info className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => handleLogSubmit('service')} 
              className="w-full"
              disabled={createLogWithPhotoMutation.isPending}
            >
              Save Service Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Preview Dialog for Photos/Documents */}
      <Dialog open={previewUrl !== null} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent aria-describedby={undefined} className="w-[90%] max-h-[90vh] rounded-xl">
          <DialogHeader>
            <DialogTitle className="pt-[10px] pb-[10px]">{previewName}</DialogTitle>
            <DialogDescription className="sr-only">Preview uploaded evidence file.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {previewType === 'image' ? (
              <ImageWithFallback
                src={previewUrl || ''}
                alt={previewName}
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Paperclip className="w-16 h-16 text-slate-400" />
                <a 
                  href={previewUrl || ''} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open Document
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* AI Analysis Results Modal */}
      <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Case Analysis
            </DialogTitle>
            <DialogDescription className="sr-only">AI summary and recommendations for this incident.</DialogDescription>
          </DialogHeader>
          {analysisResult && (
            <div className="space-y-6 py-4">
              {/* Summary */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Summary</h3>
                <p className="text-slate-600 text-sm">{analysisResult.summary}</p>
              </div>

              {/* Evidence Score & Recommendation */}
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-slate-500 mb-1">Evidence Score</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">{analysisResult.evidenceScore}</span>
                    <span className="text-slate-400">/10</span>
                  </div>
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-slate-500 mb-1">Recommendation</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    analysisResult.recommendation === 'strong' 
                      ? 'bg-green-100 text-green-700' 
                      : analysisResult.recommendation === 'moderate'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {analysisResult.recommendation === 'strong' ? 'Strong Case' : 
                     analysisResult.recommendation === 'moderate' ? 'Moderate Case' : 'Weak Case'}
                  </span>
                </div>
              </div>

              {/* Violations */}
              {analysisResult.violations && analysisResult.violations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Potential Violations</h3>
                  <div className="space-y-2">
                    {analysisResult.violations.map((v, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <span className="font-mono text-xs text-blue-600">{v.code}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            v.severity === 'high' ? 'bg-red-100 text-red-600' :
                            v.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {v.severity}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{v.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Analysis */}
              {analysisResult.timelineAnalysis && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Timeline Analysis</h3>
                  <p className="text-slate-600 text-sm bg-slate-50 rounded-lg p-3">{analysisResult.timelineAnalysis}</p>
                </div>
              )}

              {/* Strength & Weakness Factors */}
              <div className="grid grid-cols-2 gap-4">
                {analysisResult.strengthFactors && analysisResult.strengthFactors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-green-700 mb-2">Strengths</h3>
                    <ul className="space-y-1">
                      {analysisResult.strengthFactors.map((f, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">+</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisResult.weaknessFactors && analysisResult.weaknessFactors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-red-700 mb-2">Weaknesses</h3>
                    <ul className="space-y-1">
                      {analysisResult.weaknessFactors.map((f, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                          <span className="text-red-500 mt-0.5">-</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Next Steps */}
              {analysisResult.nextSteps && analysisResult.nextSteps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Recommended Next Steps</h3>
                  <ol className="space-y-2">
                    {analysisResult.nextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="text-xs text-slate-400 pt-4 border-t">
                This analysis is for informational purposes only and does not constitute legal advice. 
                Consult with a qualified attorney for specific legal guidance.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <ScrollArea ref={scrollRef} className="relative overflow-hidden flex-1 p-4 bg-slate-50 pt-[0px] pb-[0px]">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {chatLogs.length === 0 && (
              <div className="flex items-center justify-center h-[calc(100vh-280px)] bg-gradient-to-b from-slate-50 to-slate-100/50 pt-[0px] pb-[0px] overflow-hidden mt-[50px] mb-[50px]" data-testid="chat-empty-state">
                <div className="flex flex-col items-center select-none w-full max-w-sm px-4" data-testid="ai-assistant-placeholder">
                  <div className="bg-white/90 border border-slate-200/60 rounded-3xl px-8 py-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full flex flex-col items-center pt-[40px] pb-[40px]">
                    <span className="block text-7xl font-light text-slate-300 leading-[0.8] text-center tracking-tighter">Your</span>
                    <span className="block text-7xl font-light text-slate-300 leading-[0.8] text-center tracking-tighter mt-[9px] mb-[9px]">Assistant</span>
                  </div>
                  <div className="mt-6 w-full max-w-[340px]">
                    <div className="bg-white/70 border border-slate-200/50 rounded-2xl px-6 py-4 shadow-[0_4px_15px_rgb(0,0,0,0.02)] pt-[1px] pb-[1px]">
                      <span className="text-slate-400 font-light text-[18px] text-center block leading-relaxed">Ask a question about your case to get started.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {chatLogs.map((log) => (
              <div id={`chat-entry-${log.id}`} key={log.id} className={`flex gap-4 transition-all duration-500 ${!log.isAi ? "flex-row-reverse" : ""}`}>
                <div className={`flex flex-col min-w-0 ${log.isAi ? 'max-w-full md:max-w-[85%]' : 'max-w-[75%] md:max-w-[85%]'}`}>
                  {editLogId === log.id && (
                    <>
                      {/* Desktop inline edit */}
                      <div className="hidden md:flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-sm w-full">
                        <Textarea
                          value={editLogContent}
                          onChange={(e) => setEditLogContent(e.target.value)}
                          className="min-h-[140px] text-sm mt-[10px] mb-[10px]"
                          data-testid={`edit-chat-textarea-${log.id}`}
                        />
                        
                        {/* Attachment management section */}
                        <div className="space-y-2">
                          {/* Show existing attachments with remove buttons */}
                          {editLogAttachments.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {editLogAttachments.map((url, idx) => (
                                <div key={idx} className="relative group mt-[5px] mb-[5px]">
                                  <img 
                                    src={url} 
                                    loading="lazy"
                                    alt={`Attachment ${idx + 1}`}
                                    className="w-12 h-12 object-cover rounded border border-slate-200 mt-[6px] mb-[6px]"
                                  />
                                  <button 
                                    onClick={() => setEditLogAttachments(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-testid={`remove-edit-attachment-${idx}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Evidence picker for edit */}
                          {showEditEvidencePicker && (() => {
                            const photoTypes = ['photo', 'call_photo', 'text_photo', 'email_photo', 'chat_photo', 'service_photo'];
                            const photoLogs = logs?.filter(l => photoTypes.includes(l.type) && l.fileUrl) || [];
                            return (
                              <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
                                <div className="text-xs text-slate-500 mb-1">Select from evidence:</div>
                                <div className="flex gap-1 flex-wrap">
                                  {photoLogs.map(l => (
                                    <button 
                                      key={l.id} 
                                      onClick={() => {
                                        if (!editLogAttachments.includes(l.fileUrl!)) {
                                          setEditLogAttachments(prev => [...prev, l.fileUrl!]);
                                        }
                                        setShowEditEvidencePicker(false);
                                      }}
                                      className="relative"
                                      data-testid={`edit-evidence-picker-${l.id}`}
                                    >
                                      <img 
                                        src={l.fileUrl!} 
                                        loading="lazy"
                                        alt="Evidence" 
                                        className="w-10 h-10 object-cover rounded border border-slate-300 hover:border-blue-500 transition-colors"
                                      />
                                    </button>
                                  ))}
                                  {photoLogs.length === 0 && (
                                    <div className="text-xs text-slate-400">No photos in evidence</div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          
                          {/* Add attachment buttons - stacked vertically */}
                          <div className="flex flex-col gap-2">
                            <input 
                              type="file" 
                              ref={editPhotoInputRef} 
                              onChange={handleEditPhotoUpload}
                              accept="image/*,.pdf,.doc,.docx,.txt" 
                              multiple
                              className="hidden"
                            />
                            <input 
                              type="file" 
                              accept="image/*,.pdf,.doc,.docx,.txt"
                              multiple
                              onChange={handleEditPhotoUpload}
                              className="hidden"
                              id="edit-chat-folder-input-desktop"
                              {...({ webkitdirectory: "", directory: "" } as any)}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => editPhotoInputRef.current?.click()}
                              className="text-xs w-full justify-start"
                              data-testid="button-edit-upload-file"
                            >
                              <Paperclip className="w-4 h-4 mr-1" />
                              Upload File
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('edit-chat-folder-input-desktop')?.click()}
                              className="text-xs w-full justify-start"
                              data-testid="button-edit-upload-folder"
                            >
                              <FolderUp className="w-4 h-4 mr-1" />
                              Upload Folder
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowEditEvidencePicker(!showEditEvidencePicker)}
                              className="text-xs w-full justify-start"
                              data-testid="button-edit-pick-evidence"
                            >
                              <FolderOpen className="w-4 h-4 mr-1" />
                              From Evidence
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setEditLogId(null); setEditLogContent(""); setEditLogAttachments([]); setShowEditEvidencePicker(false); }}
                            data-testid={`cancel-edit-chat-${log.id}`}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => editAndResendMutation.mutate({ logId: log.id, newContent: editLogContent, attachments: editLogAttachments })}
                            disabled={editAndResendMutation.isPending}
                            data-testid={`save-edit-chat-${log.id}`}
                          >
                            Save & Resend
                          </Button>
                        </div>
                      </div>
                      
                      {/* Mobile centered modal edit */}
                      <div className="md:hidden">
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 bg-black/50 z-[9998]"
                          onClick={() => { setEditLogId(null); setEditLogContent(""); setEditLogAttachments([]); setShowEditEvidencePicker(false); }}
                        />
                        {/* Centered modal */}
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                          <div className="w-[90%] max-w-md bg-white border border-slate-200 rounded-xl shadow-lg pt-12 pb-4 px-4 flex flex-col gap-2 relative">
                            <button
                              onClick={() => { setEditLogId(null); setEditLogContent(""); setEditLogAttachments([]); setShowEditEvidencePicker(false); }}
                              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 transition-colors"
                              data-testid="close-edit-chat-mobile"
                            >
                              <X className="w-4 h-4 text-slate-500" />
                            </button>
                            <Textarea
                              value={editLogContent}
                              onChange={(e) => setEditLogContent(e.target.value)}
                              className="min-h-[140px] text-sm placeholder:text-slate-400"
                              placeholder="Edit message..."
                            />
                            
                            {/* Show existing attachments */}
                            {editLogAttachments.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {editLogAttachments.map((url, idx) => (
                                  <div key={idx} className="relative group">
                                    <img 
                                      src={url} 
                                      loading="lazy"
                                      alt={`Attachment ${idx + 1}`}
                                      className="w-12 h-12 object-cover rounded border border-slate-200"
                                    />
                                    <button 
                                      onClick={() => setEditLogAttachments(prev => prev.filter((_, i) => i !== idx))}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Attachment buttons */}
                            <div className="flex flex-col gap-2">
                              <input 
                                type="file" 
                                accept="image/*,.pdf,.doc,.docx,.txt"
                                multiple
                                onChange={handleEditPhotoUpload}
                                className="hidden"
                                id="edit-chat-folder-input-mobile"
                                {...({ webkitdirectory: "", directory: "" } as any)}
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => editPhotoInputRef.current?.click()}
                                className="w-full justify-start"
                              >
                                <Paperclip className="w-4 h-4 mr-2" />
                                Upload File
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => document.getElementById('edit-chat-folder-input-mobile')?.click()}
                                className="w-full justify-start"
                              >
                                <FolderUp className="w-4 h-4 mr-2" />
                                Upload Folder
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowEditEvidencePicker(!showEditEvidencePicker)}
                                className="w-full justify-start"
                              >
                                <FolderOpen className="w-4 h-4 mr-2" />
                                From Evidence
                              </Button>
                            </div>
                            
                            {/* Evidence picker */}
                            {showEditEvidencePicker && (() => {
                              const photoTypes = ['photo', 'call_photo', 'text_photo', 'email_photo', 'chat_photo', 'service_photo'];
                              const photoLogs = logs?.filter(l => photoTypes.includes(l.type) && l.fileUrl) || [];
                              return (
                                <div className="p-2 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
                                  <div className="text-xs text-slate-500 mb-1">Select from evidence:</div>
                                  <div className="flex gap-1 flex-wrap">
                                    {photoLogs.map(l => (
                                      <button 
                                        key={l.id} 
                                        onClick={() => {
                                          if (!editLogAttachments.includes(l.fileUrl!)) {
                                            setEditLogAttachments(prev => [...prev, l.fileUrl!]);
                                          }
                                          setShowEditEvidencePicker(false);
                                        }}
                                        className="relative"
                                      >
                                        <img 
                                          src={l.fileUrl!} 
                                          loading="lazy"
                                          alt="Evidence" 
                                          className="w-10 h-10 object-cover rounded border border-slate-300 hover:border-blue-500 transition-colors"
                                        />
                                      </button>
                                    ))}
                                    {photoLogs.length === 0 && (
                                      <div className="text-xs text-slate-400">No photos in evidence</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                            
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setEditLogId(null); setEditLogContent(""); setEditLogAttachments([]); setShowEditEvidencePicker(false); }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => editAndResendMutation.mutate({ logId: log.id, newContent: editLogContent, attachments: editLogAttachments })}
                                disabled={editAndResendMutation.isPending}
                              >
                                Save & Resend
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {editLogId !== log.id && (
                    <>
                              <div className={`p-4 rounded-xl text-sm leading-relaxed transition-all duration-500 overflow-hidden mt-[10px] mb-[10px] pt-[8px] pb-[8px] ${
                                log.isAi 
                                  ? "bg-transparent text-slate-700" 
                                  : "bg-[var(--color-user-bubble)] text-slate-600 font-normal border border-[var(--color-user-bubble-border)] shadow-sm"
                              }`}>
                        {log.isAi ? (
                          <div style={{ fontFamily: 'var(--font-chat)' }}>
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                li: ({children}) => <li className="mb-1">{children}</li>,
                                h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                                code: ({children, className}) => {
                                  const isInline = !className;
                                  return isInline 
                                    ? <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">{children}</code>
                                    : <code className="block bg-slate-100 p-2 rounded text-xs overflow-x-auto my-2">{children}</code>;
                                },
                                pre: ({children, ...props}) => {
                                  const textContent = String((props as any).node?.children?.[0]?.children?.[0]?.value || children);
                                  return (
                                    <div className="relative group/code my-2">
                                      <pre className="bg-slate-100 p-3 pr-12 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words">{children}</pre>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(textContent);
                                          toast({ title: "Copied!", description: "Template copied to clipboard" });
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-600 hover:text-slate-800 transition-colors"
                                        title="Copy to clipboard"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>
                                    </div>
                                  );
                                },
                                blockquote: ({children}) => <blockquote className="border-l-2 border-slate-300 pl-3 italic my-2">{children}</blockquote>,
                                strong: ({children}) => <strong className="font-bold">{children}</strong>,
                                table: ({children}) => (
                                  <div className="overflow-x-auto my-3">
                                    <table className="min-w-full border-collapse border border-slate-300 text-sm">{children}</table>
                                  </div>
                                ),
                                thead: ({children}) => <thead className="bg-slate-100">{children}</thead>,
                                tbody: ({children}) => <tbody>{children}</tbody>,
                                tr: ({children}) => <tr className="border-b border-slate-200">{children}</tr>,
                                th: ({children}) => <th className="border border-slate-300 px-3 py-2 text-left font-bold bg-slate-100">{children}</th>,
                                td: ({children}) => <td className="border border-slate-300 px-3 py-2">{children}</td>,
                              }}
                            >
                              {log.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <>
                            {log.content}
                            {/* Show attachment thumbnails for user messages */}
                            {(log.metadata as any)?.attachedImages?.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap max-w-full overflow-hidden">
                                {((log.metadata as any).attachedImages as string[]).map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    loading="lazy"
                                    alt={`Attachment ${idx + 1}`}
                                    className="w-8 h-8 object-cover rounded border border-white/30 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const photoLog = logs?.find(l => l.fileUrl === url);
                                      if (photoLog) {
                                        openPreview(photoLog);
                                      } else {
                                        setPreviewUrl(url);
                                        setPreviewType('image');
                                        setPreviewName(`Attachment ${idx + 1}`);
                                      }
                                    }}
                                    data-testid={`chat-attachment-thumb-${log.id}-${idx}`}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-[0px] pb-[0px] justify-end mt-[0px] mb-[0px]">
                        <span className="text-xs text-slate-400 ml-[5px] mr-[5px]">
                          {formatDateTime(log.createdAt)}
                        </span>
                        {log.isAi ? (
                          <>
                            {/* AI message controls: copy, resend, delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                navigator.clipboard.writeText(log.content);
                                toast({ title: "Copied!", description: "Message copied to clipboard" });
                              }}
                              title="Copy message"
                              data-testid={`copy-ai-${log.id}`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${resendMutation.isPending ? 'text-slate-900 bg-slate-200 opacity-60 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                              disabled={resendMutation.isPending}
                              onClick={() => {
                                // Find the user message before this AI response and resend it
                                const chatLogsArr = chatLogs || [];
                                const idx = chatLogsArr.findIndex(l => l.id === log.id);
                                if (idx > 0) {
                                  const prevUserLog = chatLogsArr[idx - 1];
                                  if (!prevUserLog.isAi) {
                                    resendMutation.mutate({ logId: prevUserLog.id, message: prevUserLog.content });
                                  }
                                }
                              }}
                              title={resendMutation.isPending ? "Regenerating..." : "Regenerate response"}
                              data-testid={`resend-ai-${log.id}`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => cascadeDeleteMutation.mutate(log.id)}
                              title="Delete this and all messages below"
                              data-testid={`delete-ai-${log.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {/* User message controls: edit, resend, delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                              onClick={() => { 
                                setEditLogId(log.id); 
                                setEditLogContent(log.content);
                                // Load existing attachments
                                const existingAttachments = (log.metadata as any)?.attachedImages || [];
                                setEditLogAttachments(existingAttachments);
                                setShowEditEvidencePicker(false);
                              }}
                              title="Edit message"
                              data-testid={`edit-chat-${log.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${resendMutation.isPending ? 'text-slate-900 bg-slate-200 opacity-60 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                              disabled={resendMutation.isPending}
                              onClick={() => resendMutation.mutate({ logId: log.id, message: log.content })}
                              title={resendMutation.isPending ? "Regenerating..." : "Resend message"}
                              data-testid={`resend-user-${log.id}`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => cascadeDeleteMutation.mutate(log.id)}
                              title="Delete this and all messages below"
                              data-testid={`delete-user-${log.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {(sendMutation.isPending || resendMutation.isPending) && (
              <div className="flex gap-4 animate-fade-in-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-500 text-sm italic">
                  Analyzing your case...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <ChatInput
          ref={chatInputRef}
          incidentId={id!}
          logs={logs}
          isSending={sendMutation.isPending}
          autoFocusWhenEmpty={shouldAutoFocus}
          onSend={(message, attachments) => sendMutation.mutate({ message, attachments })}
        />
      </div>
      <GuidedTour />
    </div>
  );
}
