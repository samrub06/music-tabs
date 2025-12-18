import { useEffect, useRef, useState } from 'react';

interface UseMetronomeProps {
  bpm?: number | null;
  isActive: boolean;
  onToggle: () => void;
}

/**
 * Hook pour gérer un métronome avec son de click
 * Génère un son de click à chaque beat basé sur le BPM
 */
export function useMetronome({ bpm, isActive, onToggle }: UseMetronomeProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const beatCountRef = useRef<number>(0);

  // Initialiser l'AudioContext une seule fois
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      // Nettoyer l'AudioContext au démontage
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, []);

  // Fonction pour générer un son de click
  const playClick = (isAccent: boolean = false) => {
    if (!audioContextRef.current) return;

    const context = audioContextRef.current;
    
    // Reprendre le contexte audio si suspendu (nécessaire pour certains navigateurs)
    if (context.state === 'suspended') {
      context.resume();
    }

    // Créer un oscillator pour le son
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    // Connecter les nodes
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Configurer le son
    // Son plus grave (600 Hz) pour l'accent, plus aigu (1000 Hz) pour les beats normaux
    oscillator.frequency.value = isAccent ? 600 : 1000;
    oscillator.type = 'sine';

    // Enveloppe ADSR très courte pour un son sec
    const now = context.currentTime;
    const attackTime = 0.001; // 1ms
    const decayTime = 0.01; // 10ms
    const sustainLevel = isAccent ? 0.3 : 0.2;
    const releaseTime = 0.04; // 40ms
    const duration = attackTime + decayTime + releaseTime;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(isAccent ? 0.5 : 0.3, now + attackTime);
    gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    // Démarrer et arrêter l'oscillator
    oscillator.start(now);
    oscillator.stop(now + duration);
  };

  // Gérer le métronome actif/inactif
  useEffect(() => {
    // Nettoyer l'intervalle existant
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Vérifier si le métronome doit être actif
    if (!isActive || !bpm || bpm <= 0) {
      beatCountRef.current = 0;
      return;
    }

    // Calculer l'intervalle en millisecondes
    const intervalMs = 60000 / bpm;

    // Démarrer le métronome
    beatCountRef.current = 0;
    playClick(true); // Premier beat avec accent

    intervalRef.current = setInterval(() => {
      beatCountRef.current += 1;
      // Premier beat de chaque mesure (tous les 4 beats) avec accent
      const isAccent = beatCountRef.current % 4 === 0;
      playClick(isAccent);
    }, intervalMs);

    // Nettoyer l'intervalle au démontage ou quand isActive/bpm change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, bpm]);

  return {
    isActive,
    bpm: bpm || null,
    toggle: onToggle
  };
}

