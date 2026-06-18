import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';

const db = getFirestore();

const REPORT_CATEGORIES = [
  'Harassment',
  'Hate Speech',
  'Inappropriate Media',
  'Spam',
  'Doxxing'
];

export default function ReportInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [loadingStory, setLoadingStory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        toast.error('Please sign in to report a story');
        navigate('/auth');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchStory = async () => {
      if (!id) return;
      try {
        const storyDoc = await getDoc(doc(db, 'stories', id));
        if (storyDoc.exists()) {
          setStoryTitle(storyDoc.data().title || '');
          setStoryContent(storyDoc.data().content || '');
        } else {
          toast.error('Story not found');
          navigate('/stories');
        }
      } catch (error) {
        console.error('Error fetching story:', error);
        toast.error('Failed to load story details');
        navigate('/stories');
      } finally {
        setLoadingStory(false);
      }
    };

    fetchStory();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    if (!user) {
      toast.error('Please sign in to report a story');
      navigate('/auth');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        story_id: id,
        story_title: storyTitle,
        reason,
        details,
        reported_at: serverTimestamp(),
        user_id: user.uid,
        status: 'pending'
      });

      toast.success('Story reported. Thank you for keeping SafeVoice safe.');
      navigate('/stories');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <Loader2 className="animate-spin h-10 w-10 text-pink-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading story details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pt-24 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 dark:bg-red-950 p-3 rounded-full text-red-600 dark:text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Report Story</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Help us keep our community safe and supportive.</p>
          </div>
        </div>

        {/* Story Preview */}
        <div className="bg-gray-55 dark:bg-gray-900/50 p-4 rounded-xl mb-8 border border-gray-150 dark:border-gray-750">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Story Title</span>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{storyTitle}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">{storyContent}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason Selection */}
          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Reason for reporting <span className="text-red-500">*</span>
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-shadow"
              required
            >
              <option value="" disabled>Select a category...</option>
              {REPORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Additional Details */}
          <div>
            <label htmlFor="details" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              id="details"
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any additional context or specific details about why you are reporting this story..."
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-shadow resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Submitting Report...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
