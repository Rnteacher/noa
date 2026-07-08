export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          profile_id: string
          read_at: string
        }
        Insert: {
          announcement_id: string
          id?: string
          profile_id: string
          read_at?: string
        }
        Update: {
          announcement_id?: string
          id?: string
          profile_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_target_groups: {
        Row: {
          announcement_id: string
          group_id: string
          id: string
        }
        Insert: {
          announcement_id: string
          group_id: string
          id?: string
        }
        Update: {
          announcement_id?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_target_groups_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_target_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_target_roles: {
        Row: {
          announcement_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          announcement_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          announcement_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "announcement_target_roles_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_target_users: {
        Row: {
          announcement_id: string
          id: string
          profile_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          profile_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_target_users_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_target_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          expires_at: string | null
          id: string
          is_pinned: boolean
          published_at: string
          push_enabled: boolean
          requires_acknowledgement: boolean
          target_type: Database["public"]["Enums"]["announcement_target_type"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          published_at?: string
          push_enabled?: boolean
          requires_acknowledgement?: boolean
          target_type?: Database["public"]["Enums"]["announcement_target_type"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          published_at?: string
          push_enabled?: boolean
          requires_acknowledgement?: boolean
          target_type?: Database["public"]["Enums"]["announcement_target_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_groups: {
        Row: {
          event_id: string
          group_id: string
          id: string
        }
        Insert: {
          event_id: string
          group_id: string
          id?: string
        }
        Update: {
          event_id?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          color_key: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          google_calendar_event_id: string | null
          id: string
          is_all_day: boolean
          location: string | null
          push_enabled: boolean
          recurrence_rule: string | null
          school_year_id: string
          starts_at: string
          title: string
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          color_key?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          google_calendar_event_id?: string | null
          id?: string
          is_all_day?: boolean
          location?: string | null
          push_enabled?: boolean
          recurrence_rule?: string | null
          school_year_id: string
          starts_at: string
          title: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          color_key?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          google_calendar_event_id?: string | null
          id?: string
          is_all_day?: boolean
          location?: string | null
          push_enabled?: boolean
          recurrence_rule?: string | null
          school_year_id?: string
          starts_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followed_students: {
        Row: {
          created_at: string
          id: string
          notification_level: string
          profile_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_level?: string
          profile_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_level?: string
          profile_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followed_students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followed_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      group_mentors: {
        Row: {
          active_from: string
          active_until: string | null
          created_at: string
          group_id: string
          id: string
          is_primary: boolean
          mentor_id: string
          updated_at: string
        }
        Insert: {
          active_from: string
          active_until?: string | null
          created_at?: string
          group_id: string
          id?: string
          is_primary?: boolean
          mentor_id: string
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_until?: string | null
          created_at?: string
          group_id?: string
          id?: string
          is_primary?: boolean
          mentor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_mentors_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_mentors_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_group_target_groups: {
        Row: {
          group_id: string
          id: string
          learning_group_id: string
        }
        Insert: {
          group_id: string
          id?: string
          learning_group_id: string
        }
        Update: {
          group_id?: string
          id?: string
          learning_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_group_target_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_group_target_groups_learning_group_id_fkey"
            columns: ["learning_group_id"]
            isOneToOne: false
            referencedRelation: "learning_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_groups: {
        Row: {
          active_from: string
          active_until: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          leader_id: string | null
          room: string | null
          school_year_id: string
          starts_at: string
          title: string
          updated_at: string
          updated_by: string | null
          weekday: Database["public"]["Enums"]["weekday"]
        }
        Insert: {
          active_from: string
          active_until?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          leader_id?: string | null
          room?: string | null
          school_year_id: string
          starts_at: string
          title: string
          updated_at?: string
          updated_by?: string | null
          weekday: Database["public"]["Enums"]["weekday"]
        }
        Update: {
          active_from?: string
          active_until?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          leader_id?: string | null
          room?: string | null
          school_year_id?: string
          starts_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          weekday?: Database["public"]["Enums"]["weekday"]
        }
        Relationships: [
          {
            foreignKeyName: "learning_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_groups_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_groups_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_groups_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          deep_link: string | null
          id: string
          profile_id: string
          read_at: string | null
          sent_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          deep_link?: string | null
          id?: string
          profile_id: string
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          deep_link?: string | null
          id?: string
          profile_id?: string
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_roles: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_current: boolean
          school_year_id: string
          status: Database["public"]["Enums"]["traffic_light_status"]
          status_note: string | null
          student_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_current?: boolean
          school_year_id: string
          status?: Database["public"]["Enums"]["traffic_light_status"]
          status_note?: string | null
          student_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_current?: boolean
          school_year_id?: string
          status?: Database["public"]["Enums"]["traffic_light_status"]
          status_note?: string | null
          student_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          device_label: string | null
          endpoint: string
          id: string
          is_active: boolean
          last_used_at: string | null
          p256dh_key: string
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          auth_key: string
          created_at?: string
          device_label?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh_key: string
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          auth_key?: string
          created_at?: string
          device_label?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh_key?: string
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      school_years: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          is_current: boolean
          name: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          is_current?: boolean
          name: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          is_current?: boolean
          name?: string
          starts_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_access_grant_roles: {
        Row: {
          created_at: string
          grant_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          grant_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          grant_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "staff_access_grant_roles_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "staff_access_grants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_access_grants: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_access_grants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_emotional_statuses: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          status: Database["public"]["Enums"]["traffic_light_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["traffic_light_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["traffic_light_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_emotional_statuses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_emotional_statuses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_goals: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_primary: boolean
          school_year_id: string
          status: Database["public"]["Enums"]["goal_status"]
          student_id: string
          title: string
          updated_at: string
          updated_by: string | null
          visible_to_student: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean
          school_year_id: string
          status?: Database["public"]["Enums"]["goal_status"]
          student_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
          visible_to_student?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean
          school_year_id?: string
          status?: Database["public"]["Enums"]["goal_status"]
          student_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          visible_to_student?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_goals_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_goals_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_groups: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          layer: string | null
          name: string
          school_year_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          layer?: string | null
          name: string
          school_year_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          layer?: string | null
          name?: string
          school_year_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_groups_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      student_masters: {
        Row: {
          active_from: string
          active_until: string | null
          created_at: string
          id: string
          is_primary: boolean
          master_id: string
          project_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          active_from: string
          active_until?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          master_id: string
          project_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_until?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          master_id?: string
          project_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_masters_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_masters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "current_student_project_statuses"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "student_masters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_masters_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_messages: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_important: boolean
          parent_message_id: string | null
          student_id: string
          tags: Database["public"]["Enums"]["student_message_tag"][]
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_important?: boolean
          parent_message_id?: string | null
          student_id: string
          tags?: Database["public"]["Enums"]["student_message_tag"][]
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_important?: boolean
          parent_message_id?: string | null
          student_id?: string
          tags?: Database["public"]["Enums"]["student_message_tag"][]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "student_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          group_id: string
          id: string
          is_active: boolean
          last_name: string
          photo_url: string | null
          primary_phone: string | null
          school_year_id: string
          secondary_phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          group_id: string
          id?: string
          is_active?: boolean
          last_name: string
          photo_url?: string | null
          primary_phone?: string | null
          school_year_id: string
          secondary_phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          group_id?: string
          id?: string
          is_active?: boolean
          last_name?: string
          photo_url?: string | null
          primary_phone?: string | null
          school_year_id?: string
          secondary_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          last_attempt_at: string | null
          payload: Json
          status: string
          webhook_endpoint_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          status?: string
          webhook_endpoint_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          status?: string
          webhook_endpoint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_endpoint_id_fkey"
            columns: ["webhook_endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      current_student_project_statuses: {
        Row: {
          project_id: string | null
          school_year_id: string | null
          status: Database["public"]["Enums"]["traffic_light_status"] | null
          status_note: string | null
          student_id: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      latest_student_emotional_statuses: {
        Row: {
          created_at: string | null
          created_by: string | null
          emotional_status_id: string | null
          note: string | null
          status: Database["public"]["Enums"]["traffic_light_status"] | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_emotional_statuses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_emotional_statuses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_student_change_notification: {
        Args: {
          actor_id: string
          event_type: string
          target_student_id: string
        }
        Returns: undefined
      }
      current_profile_id: { Args: never; Returns: string }
      current_user_can_manage_student_photo: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      current_user_can_read_announcement: {
        Args: { target_announcement_id: string }
        Returns: boolean
      }
      current_user_can_read_calendar_event: {
        Args: { target_event_id: string }
        Returns: boolean
      }
      current_user_can_update_student_emotional_status: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      current_user_can_update_student_goals: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      current_user_can_update_student_project: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      current_user_has_any_role: {
        Args: { required_roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      current_user_has_role: {
        Args: { required_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      current_user_is_active_staff: { Args: never; Returns: boolean }
      current_user_is_group_master: {
        Args: { target_group_id: string }
        Returns: boolean
      }
      current_user_is_group_mentor: {
        Args: { target_group_id: string }
        Returns: boolean
      }
      current_user_is_leadership_or_above: { Args: never; Returns: boolean }
      current_user_is_manager_or_super_admin: { Args: never; Returns: boolean }
      current_user_is_student_master: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      current_user_is_student_mentor: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      current_user_is_super_admin: { Args: never; Returns: boolean }
      update_student_photo_path: {
        Args: { new_photo_path: string; target_student_id: string }
        Returns: undefined
      }
    }
    Enums: {
      announcement_target_type: "all_staff" | "roles" | "groups" | "users"
      app_role:
        | "staff"
        | "mentor"
        | "master"
        | "counselor"
        | "leadership"
        | "manager"
        | "super_admin"
      event_visibility:
        | "all_school"
        | "groups"
        | "staff_only"
        | "leadership_only"
      goal_status: "active" | "completed" | "paused" | "archived"
      student_message_tag:
        | "general"
        | "project"
        | "emotional"
        | "attendance"
        | "family"
        | "incident"
      traffic_light_status: "green" | "yellow" | "red"
      weekday:
        | "sunday"
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      announcement_target_type: ["all_staff", "roles", "groups", "users"],
      app_role: [
        "staff",
        "mentor",
        "master",
        "counselor",
        "leadership",
        "manager",
        "super_admin",
      ],
      event_visibility: [
        "all_school",
        "groups",
        "staff_only",
        "leadership_only",
      ],
      goal_status: ["active", "completed", "paused", "archived"],
      student_message_tag: [
        "general",
        "project",
        "emotional",
        "attendance",
        "family",
        "incident",
      ],
      traffic_light_status: ["green", "yellow", "red"],
      weekday: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
    },
  },
} as const

