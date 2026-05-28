import type { Tables, TablesInsert, TablesUpdate } from './supabase'

export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Organization = Tables<'organizations'>
export type OrganizationInsert = TablesInsert<'organizations'>

export type Role = Tables<'roles'>
export type ProfileRole = Tables<'profile_roles'>