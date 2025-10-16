import { supabase } from '../supabase';
import { analyzeSongChords, analyzeStructuredSongChords } from '@/utils/chordAnalysis';
import { Song } from '@/types';

export const chordAnalysisService = {
  // Analyze chords for a single song
  async analyzeSongChords(songId: string): Promise<{ firstChord?: string; lastChord?: string; chordProgression?: string[] }> {
    const { data: song, error } = await supabase
      .from('songs')
      .select('id, content, sections, key, capo')
      .eq('id', songId)
      .single();

    if (error || !song) {
      throw new Error(`Song not found: ${songId}`);
    }

    // Try structured analysis first (for songs with sections)
    if (song.sections && song.sections.length > 0) {
      return analyzeStructuredSongChords(song, song.key, song.capo);
    }
    
    // Fallback to content analysis
    return analyzeSongChords(song.content || '', song.key, song.capo);
  },

  // Analyze chords for a song object (no database fetch needed)
  analyzeSongChordsFromObject(song: any): { firstChord?: string; lastChord?: string; chordProgression?: string[] } {
    // Try structured analysis first (for songs with sections)
    if (song.sections && song.sections.length > 0) {
      return analyzeStructuredSongChords(song, song.key, song.capo);
    }
    
    // Fallback to content analysis
    return analyzeSongChords(song.content || '', song.key, song.capo);
  },

  // Update song with chord analysis
  async updateSongWithChords(songId: string): Promise<Song> {
    const chordAnalysis = await this.analyzeSongChords(songId);
    
    const { data, error } = await supabase
      .from('songs')
      .update({
        first_chord: chordAnalysis.firstChord || null,
        last_chord: chordAnalysis.lastChord || null,
        chord_progression: chordAnalysis.chordProgression || null
      })
      .eq('id', songId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update song chords: ${error.message}`);
    }

    return data;
  },

  // Analyze all songs that don't have chord information
  async analyzeAllSongsWithoutChords(): Promise<{ updated: number; errors: string[] }> {
    const { data: songs, error } = await supabase
      .from('songs')
      .select('id, content, sections, key, capo')
      .or('first_chord.is.null,last_chord.is.null');

    if (error) {
      throw new Error(`Failed to fetch songs: ${error.message}`);
    }

    if (!songs || songs.length === 0) {
      return { updated: 0, errors: [] };
    }

    const errors: string[] = [];
    let updated = 0;

    for (const song of songs) {
      try {
        let chordAnalysis;
        
        // Try structured analysis first (for songs with sections)
        if (song.sections && song.sections.length > 0) {
          chordAnalysis = analyzeStructuredSongChords(song, song.key, song.capo);
        } else {
          chordAnalysis = analyzeSongChords(song.content || '', song.key, song.capo);
        }
        
        const { error: updateError } = await supabase
          .from('songs')
          .update({
            first_chord: chordAnalysis.firstChord || null,
            last_chord: chordAnalysis.lastChord || null,
            chord_progression: chordAnalysis.chordProgression || null
          })
          .eq('id', song.id);

        if (updateError) {
          errors.push(`Failed to update song ${song.id}: ${updateError.message}`);
        } else {
          updated++;
        }
      } catch (error) {
        errors.push(`Failed to analyze song ${song.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { updated, errors };
  },

  // Get songs with chord information for medley generation
  async getSongsWithChords(): Promise<Song[]> {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .not('first_chord', 'is', null)
      .not('last_chord', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch songs with chords: ${error.message}`);
    }

    return data || [];
  }
};
