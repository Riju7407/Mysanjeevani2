'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AgoraRTC, {
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
  onClose: () => void;
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

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const remoteVideoTrackRef = useRef<IRemoteVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);

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
      remoteAudioTrackRef.current = null;
      remoteVideoTrackRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const init = async () => {
      setStatus('connecting');
      setErrorMessage('');

      try {
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

        client.on('user-published', async (user, mediaType) => {
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

          setHasRemoteParticipant(true);
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
    await cleanupCall();
    onClose();
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

  return (
    <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div>
            <h3 className="text-lg font-bold">
              {consultationType === 'video' ? 'Video Consultation' : 'Audio Consultation'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Channel: {channelName} · Participant: {participantLabel}
            </p>
          </div>
          <button
            onClick={leaveCall}
            className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-2 text-sm font-semibold"
          >
            End Call
          </button>
        </div>

        <div className="p-5 space-y-4">
          {status === 'connecting' && (
            <div className="rounded-xl border border-blue-700 bg-blue-900/40 px-4 py-3 text-sm">
              Connecting to Agora call...
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-xl border border-red-700 bg-red-900/40 px-4 py-3 text-sm">
              {errorMessage || 'Call failed to initialize. Please retry.'}
            </div>
          )}

          {consultationType === 'video' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-3">
                <p className="text-xs text-slate-300 mb-2">You</p>
                <div ref={localVideoRef} className="h-56 rounded-lg bg-slate-950" />
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-3">
                <p className="text-xs text-slate-300 mb-2">Other Participant</p>
                <div ref={remoteVideoRef} className="h-56 rounded-lg bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
                  {hasRemoteParticipant ? '' : 'Waiting for other participant to join...'}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
              <p className="text-4xl">🎧</p>
              <p className="mt-3 text-sm text-slate-300">
                {hasRemoteParticipant
                  ? 'Both participants are connected on audio call.'
                  : 'Audio room is ready. Waiting for other participant...'}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={toggleAudio}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
            >
              {isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
            </button>

            {consultationType === 'video' && (
              <button
                onClick={toggleVideo}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
              >
                {isVideoEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
              </button>
            )}

            <p className="text-xs text-slate-400 self-center">
              Use HTTPS or localhost for camera/microphone permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
