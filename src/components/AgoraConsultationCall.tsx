'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng';

type CallType = 'audio' | 'video';
type ParticipantType = 'patient' | 'doctor';

interface AgoraConsultationCallProps {
  isOpen: boolean;
  consultationId: string;
  consultationType: CallType;
  participantType: ParticipantType;
  participantLabel: string;
  onClose: () => void | Promise<void>;
}

export default function AgoraConsultationCall({
  isOpen,
  consultationId,
  consultationType,
  participantType,
  participantLabel,
  onClose,
}: AgoraConsultationCallProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [miniPosition, setMiniPosition] = useState<{ x: number; y: number } | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const remoteVideoTrackRef = useRef<IRemoteVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);
  const miniWindowRef = useRef<HTMLDivElement | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  const channelName = useMemo(() => {
    const safeId = consultationId.replace(/[^a-zA-Z0-9_-]/g, '');
    return `consult_${safeId}`.slice(0, 64);
  }, [consultationId]);

  const cleanupCall = useCallback(async () => {
    try {
      remoteAudioTrackRef.current?.stop();
      remoteVideoTrackRef.current?.stop();

      localAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.close();
      localAudioTrackRef.current = null;

      localVideoTrackRef.current?.stop();
      localVideoTrackRef.current?.close();
      localVideoTrackRef.current = null;

      if (clientRef.current) {
        clientRef.current.removeAllListeners();
        await clientRef.current.leave();
      }
      clientRef.current = null;
    } catch {
      // Ignore leave cleanup errors to avoid trapping users in modal.
    } finally {
      setHasRemoteParticipant(false);
      setStatus('idle');
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
      setIsMinimized(false);
      setMiniPosition(null);
      remoteAudioTrackRef.current = null;
      remoteVideoTrackRef.current = null;
    }
  }, []);

  const getDefaultMiniPosition = useCallback(() => {
    if (typeof window === 'undefined') {
      return { x: 16, y: 16 };
    }

    const panelWidth = 320;
    const panelHeight = 200;
    const margin = 16;
    const maxX = Math.max(margin, window.innerWidth - panelWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - panelHeight - margin);

    return { x: maxX, y: maxY };
  }, []);

  const clampMiniPosition = useCallback((x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y };

    const margin = 8;
    const panelWidth = miniWindowRef.current?.offsetWidth || 320;
    const panelHeight = miniWindowRef.current?.offsetHeight || 200;
    const maxX = Math.max(margin, window.innerWidth - panelWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - panelHeight - margin);

    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(margin, y), maxY),
    };
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setMiniPosition((prev) => prev || getDefaultMiniPosition());
  }, [getDefaultMiniPosition]);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const handleMiniPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMinimized || !miniWindowRef.current) return;

    dragPointerIdRef.current = event.pointerId;
    miniWindowRef.current.setPointerCapture(event.pointerId);

    const rect = miniWindowRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, [isMinimized]);

  const handleMiniPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMinimized) return;
    if (dragPointerIdRef.current !== event.pointerId || !dragOffsetRef.current) return;

    const nextX = event.clientX - dragOffsetRef.current.x;
    const nextY = event.clientY - dragOffsetRef.current.y;
    setMiniPosition(clampMiniPosition(nextX, nextY));
  }, [clampMiniPosition, isMinimized]);

  const handleMiniPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (dragPointerIdRef.current !== event.pointerId) return;

    dragPointerIdRef.current = null;
    dragOffsetRef.current = null;
    miniWindowRef.current?.releasePointerCapture(event.pointerId);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMinimized || miniPosition) return;
    setMiniPosition(getDefaultMiniPosition());
  }, [getDefaultMiniPosition, isMinimized, isOpen, miniPosition]);

  useEffect(() => {
    if (!isOpen || !isMinimized) return;

    const onResize = () => {
      setMiniPosition((prev) => {
        const fallback = prev || getDefaultMiniPosition();
        return clampMiniPosition(fallback.x, fallback.y);
      });
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampMiniPosition, getDefaultMiniPosition, isMinimized, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const init = async () => {
      setStatus('connecting');
      setErrorMessage('');

      try {
        const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');

        const tokenRes = await fetch('/api/agora/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelName,
            participantType,
          }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
          throw new Error(tokenData?.error || 'Unable to create secure Agora token');
        }

        const secureAppId = String(tokenData.appId || '');
        const secureToken = String(tokenData.token || '');
        const secureUid = Number(tokenData.uid);

        if (!secureAppId || !secureToken || !Number.isFinite(secureUid)) {
          throw new Error('Received invalid Agora credentials from server.');
        }

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        client.on('user-published', (user, mediaType) => {
          void (async () => {
            try {
              await client.subscribe(user, mediaType);

              if (mediaType === 'audio') {
                user.audioTrack?.play();
                remoteAudioTrackRef.current = user.audioTrack || null;
              }

              if (mediaType === 'video') {
                remoteVideoTrackRef.current = user.videoTrack || null;
                if (remoteVideoRef.current && user.videoTrack) {
                  user.videoTrack.play(remoteVideoRef.current);
                }
              }

              if (mounted) {
                setHasRemoteParticipant(true);
              }
            } catch (error: any) {
              if (mounted) {
                setStatus('error');
                setErrorMessage(error?.message || 'Unable to subscribe to remote participant.');
              }
            }
          })();
        });

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'audio') {
            user.audioTrack?.stop();
            remoteAudioTrackRef.current = null;
          }

          if (mediaType === 'video') {
            user.videoTrack?.stop();
            remoteVideoTrackRef.current = null;
          }

          if (!remoteAudioTrackRef.current && !remoteVideoTrackRef.current) {
            setHasRemoteParticipant(false);
          }
        });

        client.on('user-left', () => {
          remoteAudioTrackRef.current = null;
          remoteVideoTrackRef.current = null;
          setHasRemoteParticipant(false);
        });

        await client.join(secureAppId, channelName, secureToken, secureUid);

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;

        if (consultationType === 'video') {
          const videoTrack = await AgoraRTC.createCameraVideoTrack();
          localVideoTrackRef.current = videoTrack;

          if (localVideoRef.current) {
            videoTrack.play(localVideoRef.current);
          }

          await client.publish([audioTrack, videoTrack]);
        } else {
          await client.publish([audioTrack]);
        }

        if (!mounted) return;
        setStatus('connected');
      } catch (error: any) {
        if (!mounted) return;
        setStatus('error');
        setErrorMessage(error?.message || 'Unable to start Agora consultation call.');
      }
    };

    init();

    return () => {
      mounted = false;
      void cleanupCall();
    };
  }, [channelName, cleanupCall, consultationType, isOpen, participantType]);

  const leaveCall = async () => {
    // Fail-safe: mark consultation completed when user explicitly ends the call.
    try {
      await fetch(`/api/consultations/${consultationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
    } catch {
      // Keep leave action resilient even if status update request fails.
    }

    await cleanupCall();
    await Promise.resolve(onClose());
  };

  const toggleAudio = async () => {
    if (!localAudioTrackRef.current) return;
    const next = !isAudioEnabled;
    await localAudioTrackRef.current.setEnabled(next);
    setIsAudioEnabled(next);
  };

  const toggleVideo = async () => {
    if (consultationType !== 'video' || !localVideoTrackRef.current) return;
    const next = !isVideoEnabled;
    await localVideoTrackRef.current.setEnabled(next);
    setIsVideoEnabled(next);
  };

  if (!isOpen) return null;

  if (isMinimized) {
    const mini = miniPosition || getDefaultMiniPosition();

    return (
      <div
        ref={miniWindowRef}
        className="fixed z-[80] w-[88vw] max-w-xs rounded-2xl border border-slate-700/90 bg-slate-900/95 text-white shadow-2xl overflow-hidden"
        style={{ left: `${mini.x}px`, top: `${mini.y}px` }}
        onPointerDown={handleMiniPointerDown}
        onPointerMove={handleMiniPointerMove}
        onPointerUp={handleMiniPointerUp}
        onPointerCancel={handleMiniPointerUp}
      >
        <div className="px-3 py-2 border-b border-slate-700 bg-slate-900/90 cursor-grab active:cursor-grabbing select-none touch-none">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold truncate">
              {consultationType === 'video' ? 'Video Call' : 'Audio Call'} · {participantLabel}
            </p>
            <button
              onClick={handleRestore}
              className="rounded-md border border-slate-600 px-2 py-1 text-[11px] hover:bg-slate-800"
            >
              Restore
            </button>
          </div>
        </div>

        <div className="px-3 py-2 space-y-2">
          <p className="text-[11px] text-slate-300">
            {hasRemoteParticipant ? 'Connected' : 'Waiting for participant'}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleAudio}
              className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition ${isAudioEnabled ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25' : 'border-amber-500/50 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25'}`}
            >
              {isAudioEnabled ? 'Mute' : 'Unmute'}
            </button>

            {consultationType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition ${isVideoEnabled ? 'border-blue-500/50 bg-blue-500/15 text-blue-100 hover:bg-blue-500/25' : 'border-slate-500/50 bg-slate-500/15 text-slate-200 hover:bg-slate-500/25'}`}
              >
                {isVideoEnabled ? 'Camera Off' : 'Camera On'}
              </button>
            )}

            <button
              onClick={leaveCall}
              className="rounded-md bg-red-600 hover:bg-red-700 px-2.5 py-1.5 text-[11px] font-semibold"
            >
              End
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-6xl h-[92vh] rounded-2xl border border-slate-700/80 bg-slate-900 text-white shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-700/80 bg-slate-900/90">
          <div className="min-w-0">
            <h3 className="text-base sm:text-xl font-bold tracking-tight">
              {consultationType === 'video' ? 'Live Video Consultation' : 'Live Audio Consultation'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 truncate">
              Participant: {participantLabel} · Room: {channelName}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className={`rounded-full px-2.5 py-1 ${status === 'connected' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : status === 'connecting' ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' : status === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-slate-500/20 text-slate-200 border border-slate-500/30'}`}>
                {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting' : status === 'error' ? 'Connection Error' : 'Idle'}
              </span>
              <span className={`rounded-full px-2.5 py-1 border ${hasRemoteParticipant ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'bg-amber-500/20 text-amber-200 border-amber-500/30'}`}>
                {hasRemoteParticipant ? 'Doctor and Patient Online' : 'Waiting for Other Participant'}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={handleMinimize}
              className="rounded-lg border border-slate-600 hover:bg-slate-800 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold"
            >
              Minimize
            </button>
            <button
              onClick={leaveCall}
              className="rounded-lg bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold"
            >
              End Call
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-6 py-4 sm:py-5">
          {status === 'connecting' && (
            <div className="mb-4 rounded-xl border border-blue-700 bg-blue-900/40 px-4 py-3 text-sm">
              Connecting to secure consultation room...
            </div>
          )}

          {status === 'error' && (
            <div className="mb-4 rounded-xl border border-red-700 bg-red-900/40 px-4 py-3 text-sm">
              {errorMessage || 'Call failed to initialize. Please retry.'}
            </div>
          )}

          {consultationType === 'video' ? (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 h-full min-h-[420px]">
              <div className="xl:col-span-3 rounded-2xl border border-slate-700 bg-slate-800 p-3 sm:p-4 relative min-h-[300px]">
                <p className="text-xs sm:text-sm text-slate-300 mb-2">Other Participant</p>
                <div
                  ref={remoteVideoRef}
                  className="h-[52vh] min-h-[260px] sm:min-h-[340px] rounded-xl bg-slate-950 flex items-center justify-center text-slate-400 text-sm text-center px-4"
                >
                  {hasRemoteParticipant ? '' : 'Waiting for other participant to join...'}
                </div>
              </div>

              <div className="xl:col-span-1 rounded-2xl border border-slate-700 bg-slate-800 p-3 sm:p-4 min-h-[220px]">
                <p className="text-xs sm:text-sm text-slate-300 mb-2">You</p>
                <div ref={localVideoRef} className="h-[26vh] min-h-[180px] rounded-xl bg-slate-950" />
                <p className="mt-3 text-xs text-slate-400">
                  {participantType === 'doctor' ? 'Doctor preview' : 'Patient preview'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 sm:p-8 text-center min-h-[230px] flex flex-col justify-center">
                <p className="text-5xl">🎧</p>
                <p className="mt-3 text-sm sm:text-base text-slate-200 font-medium">Audio Channel Active</p>
                <p className="mt-2 text-xs sm:text-sm text-slate-400">
                  {hasRemoteParticipant ? 'Both participants are connected on audio call.' : 'Audio room is ready. Waiting for other participant...'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 sm:p-8 min-h-[230px]">
                <h4 className="text-sm sm:text-base font-semibold text-slate-100">Call Tips</h4>
                <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-300">
                  <li>Use earphones for clearer audio quality.</li>
                  <li>Keep microphone muted when not speaking.</li>
                  <li>Use strong network for uninterrupted consultation.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/80 bg-slate-900/95 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={toggleAudio}
              className={`rounded-lg border px-4 py-2 text-xs sm:text-sm font-medium transition ${isAudioEnabled ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25' : 'border-amber-500/50 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25'}`}
            >
              {isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
            </button>

            {consultationType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`rounded-lg border px-4 py-2 text-xs sm:text-sm font-medium transition ${isVideoEnabled ? 'border-blue-500/50 bg-blue-500/15 text-blue-100 hover:bg-blue-500/25' : 'border-slate-500/50 bg-slate-500/15 text-slate-200 hover:bg-slate-500/25'}`}
              >
                {isVideoEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
              </button>
            )}

            <p className="text-[11px] sm:text-xs text-slate-400 ml-auto">
              Use HTTPS or localhost for camera and microphone permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
