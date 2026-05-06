"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader2, Briefcase, MapPin, DollarSign, Send } from "lucide-react";
import { toast } from "sonner";
import { logger } from '@/lib/logger';

interface Job {
  id: string;
  title: string;
  company: { name: string; logo?: string };
  location: string;
  salaryMin?: number;
  salaryMax?: number;
}

interface RecommendJobModalProps {
  seekerId: string;
  seekerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RecommendJobModal({ 
  seekerId, 
  seekerName, 
  isOpen, 
  onClose 
}: RecommendJobModalProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs?limit=20&status=ACTIVE`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      logger.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    if (!selectedJob) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/circles/recommend-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seekerId,
          jobId: selectedJob.id,
          message: message || undefined,
        }),
      });

      if (response.ok) {
        toast.success(`已向 ${seekerName} 推荐职位「${selectedJob.title}」`);
        onClose();
        setSelectedJob(null);
        setMessage("");
      } else {
        const error = await response.json();
        toast.error(error.error || "推荐失败");
      }
    } catch (error) {
      toast.error("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">推荐职位给 {seekerName}</h2>
            <p className="text-sm text-gray-500 mt-1">选择合适的职位推荐给TA</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索职位或公司..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Job List */}
        <div className="overflow-y-auto max-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              暂无符合条件的职位
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedJob?.id === job.id
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {job.company.logo ? (
                        <img
                          src={job.company.logo}
                          alt={job.company.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        job.company.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.company.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </span>
                        {(job.salaryMin || job.salaryMax) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {job.salaryMin && `${job.salaryMin}k`}
                            {job.salaryMin && job.salaryMax && " - "}
                            {job.salaryMax && `${job.salaryMax}k`}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedJob?.id === job.id && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message & Submit */}
        {selectedJob && (
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`给 ${seekerName} 留句话（可选）...`}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              maxLength={200}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleRecommend}
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    发送推荐
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
