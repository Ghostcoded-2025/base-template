import type { Tables, TablesInsert, TablesUpdate } from './supabase'

export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>