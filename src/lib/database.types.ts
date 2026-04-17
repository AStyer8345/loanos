export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          contact_id: string | null
          created_at: string
          dismissed: boolean | null
          entity_id: string | null
          entity_type: string | null
          event_type: string | null
          external_id: string | null
          id: string
          loan_id: string | null
          occurred_at: string | null
          organization_id: string
          summary: string | null
          to_address: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          contact_id?: string | null
          created_at?: string
          dismissed?: boolean | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string
          loan_id?: string | null
          occurred_at?: string | null
          organization_id?: string
          summary?: string | null
          to_address?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          contact_id?: string | null
          created_at?: string
          dismissed?: boolean | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string
          loan_id?: string | null
          occurred_at?: string | null
          organization_id?: string
          summary?: string | null
          to_address?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log_pii: {
        Row: {
          activity_id: string
          created_at: string
          key_version: number
          organization_id: string
          pii_ciphertext: string
          pii_iv: string
          pii_tag: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          key_version?: number
          organization_id: string
          pii_ciphertext: string
          pii_iv: string
          pii_tag: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          key_version?: number
          organization_id?: string
          pii_ciphertext?: string
          pii_iv?: string
          pii_tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_pii_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activity_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_pii_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          details: Json
          id: string
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          details?: Json
          id?: string
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          details?: Json
          id?: string
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
      agent_conversations: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          messages: Json | null
          metadata: Json | null
          org_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          messages?: Json | null
          metadata?: Json | null
          org_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          messages?: Json | null
          metadata?: Json | null
          org_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_handoffs: {
        Row: {
          completed_at: string | null
          context: Json | null
          conversation_id: string | null
          created_at: string | null
          from_agent_id: string | null
          id: string
          org_id: string
          result: Json | null
          status: string | null
          to_agent_id: string
        }
        Insert: {
          completed_at?: string | null
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          from_agent_id?: string | null
          id?: string
          org_id: string
          result?: Json | null
          status?: string | null
          to_agent_id: string
        }
        Update: {
          completed_at?: string | null
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          from_agent_id?: string | null
          id?: string
          org_id?: string
          result?: Json | null
          status?: string | null
          to_agent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_handoffs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_handoffs_from_agent_id_fkey"
            columns: ["from_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_handoffs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_handoffs_to_agent_id_fkey"
            columns: ["to_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tools: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          display_name: string
          handler: string
          id: string
          input_schema: Json | null
          is_active: boolean | null
          org_id: string | null
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          handler: string
          id?: string
          input_schema?: Json | null
          is_active?: boolean | null
          org_id?: string | null
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          handler?: string
          id?: string
          input_schema?: Json | null
          is_active?: boolean | null
          org_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tools_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model: string | null
          org_id: string
          slug: string
          sort_order: number | null
          system_prompt: string
          temperature: number | null
          tools: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string | null
          org_id: string
          slug: string
          sort_order?: number | null
          system_prompt: string
          temperature?: number | null
          tools?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string | null
          org_id?: string
          slug?: string
          sort_order?: number | null
          system_prompt?: string
          temperature?: number | null
          tools?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          created_at: string | null
          id: string
          loan_id: string | null
          platform: string | null
          posted_at: string | null
          sent_at: string | null
          testimonial_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          loan_id?: string | null
          platform?: string | null
          posted_at?: string | null
          sent_at?: string | null
          testimonial_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          loan_id?: string | null
          platform?: string | null
          posted_at?: string | null
          sent_at?: string | null
          testimonial_id?: string | null
          type?: string
        }
        Relationships: []
      }
      automation_registry: {
        Row: {
          config: Json
          created_at: string
          description: string
          email_mode: string | null
          email_template: string | null
          email_test_data: Json | null
          email_variables: Json | null
          group_name: string
          id: string
          last_run_at: string | null
          last_run_status: string | null
          last_run_summary: string | null
          name: string
          org_id: string
          prompt_snapshot: string | null
          schedule: string | null
          source: string
          source_id: string
          source_node_id: string | null
          status: string
          subject_template: string | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string
          email_mode?: string | null
          email_template?: string | null
          email_test_data?: Json | null
          email_variables?: Json | null
          group_name: string
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          last_run_summary?: string | null
          name: string
          org_id: string
          prompt_snapshot?: string | null
          schedule?: string | null
          source: string
          source_id: string
          source_node_id?: string | null
          status?: string
          subject_template?: string | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string
          email_mode?: string | null
          email_template?: string | null
          email_test_data?: Json | null
          email_variables?: Json | null
          group_name?: string
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          last_run_summary?: string | null
          name?: string
          org_id?: string
          prompt_snapshot?: string | null
          schedule?: string | null
          source?: string
          source_id?: string
          source_node_id?: string | null
          status?: string
          subject_template?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_registry_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          automation_id: string
          changes_made: Json | null
          completed_at: string | null
          created_at: string
          full_log: string | null
          id: string
          org_id: string
          started_at: string
          status: string
          summary: string | null
        }
        Insert: {
          automation_id: string
          changes_made?: Json | null
          completed_at?: string | null
          created_at?: string
          full_log?: string | null
          id?: string
          org_id: string
          started_at?: string
          status?: string
          summary?: string | null
        }
        Update: {
          automation_id?: string
          changes_made?: Json | null
          completed_at?: string | null
          created_at?: string
          full_log?: string | null
          id?: string
          org_id?: string
          started_at?: string
          status?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automation_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          day_number: number
          growth_mindset_note: string | null
          id: string
          is_family_challenge: boolean | null
          prompt: string
          scripture: string | null
          scripture_ref: string | null
          sub_prompt: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          day_number: number
          growth_mindset_note?: string | null
          id?: string
          is_family_challenge?: boolean | null
          prompt: string
          scripture?: string | null
          scripture_ref?: string | null
          sub_prompt?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          day_number?: number
          growth_mindset_note?: string | null
          id?: string
          is_family_challenge?: boolean | null
          prompt?: string
          scripture?: string | null
          scripture_ref?: string | null
          sub_prompt?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          messages: Json
          organization_id: string
          record_id: string
          record_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          organization_id: string
          record_id: string
          record_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          organization_id?: string
          record_id?: string
          record_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_activity: {
        Row: {
          activity_type: string | null
          contact_id: string | null
          created_by: string | null
          id: string
          loan_id: string | null
          logged_at: string | null
          migrated: boolean | null
          notes: string | null
          organization_id: string
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          contact_id?: string | null
          created_by?: string | null
          id?: string
          loan_id?: string | null
          logged_at?: string | null
          migrated?: boolean | null
          notes?: string | null
          organization_id: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          contact_id?: string | null
          created_by?: string | null
          id?: string
          loan_id?: string | null
          logged_at?: string | null
          migrated?: boolean | null
          notes?: string | null
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_activity_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activity_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_emails: {
        Row: {
          automation_source: string | null
          body_html: string | null
          body_text: string | null
          contact_id: string | null
          created_at: string | null
          direction: string | null
          id: string
          loan_id: string | null
          sent_at: string | null
          subject: string
        }
        Insert: {
          automation_source?: string | null
          body_html?: string | null
          body_text?: string | null
          contact_id?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          loan_id?: string | null
          sent_at?: string | null
          subject: string
        }
        Update: {
          automation_source?: string | null
          body_html?: string | null
          body_text?: string | null
          contact_id?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          loan_id?: string | null
          sent_at?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_emails_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_name: string | null
          birthdate: string | null
          closing_date: string | null
          co_borrower_birthdate: string | null
          co_borrower_email: string | null
          co_borrower_first: string | null
          co_borrower_last: string | null
          co_borrower_mobile: string | null
          company_name: string | null
          contact_group: string | null
          contact_type: string | null
          created_at: string
          created_date: string | null
          current_loan_balance: number | null
          current_rate: number | null
          deals_lifetime_count: number
          deals_ytd_count: number
          do_not_call: boolean
          email: string | null
          email_opt_out: boolean | null
          first_name: string
          form_name: string | null
          group_tag: string | null
          home_phone: string | null
          hot_lead_dismissed: boolean
          id: string
          last_activity_date: string | null
          last_activity_notes: string | null
          last_activity_type: string | null
          last_deal_closed_date: string | null
          last_name: string
          last_outreach_date: string | null
          last_referral_date: string | null
          last_touch: string | null
          last_touch_at: string | null
          lead_source: string | null
          mailing_city: string | null
          mailing_country: string | null
          mailing_state: string | null
          mailing_street: string | null
          mailing_zip: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          phone_mobile: string | null
          production_tier: string | null
          realtor_email: string | null
          realtor_phone: string | null
          realtor_stage: string | null
          referral_lifetime_count: number
          referral_source_notes: string | null
          referral_type: string | null
          referral_ytd_count: number
          referred_by: string | null
          referred_by_contact_id: string | null
          referrer: string | null
          salesforce_created_date: string | null
          salesforce_id: string | null
          source: string | null
          source_page: string | null
          stage: string | null
          title: string | null
          updated_at: string
          user_id: string
          utm_params: Json | null
        }
        Insert: {
          account_name?: string | null
          birthdate?: string | null
          closing_date?: string | null
          co_borrower_birthdate?: string | null
          co_borrower_email?: string | null
          co_borrower_first?: string | null
          co_borrower_last?: string | null
          co_borrower_mobile?: string | null
          company_name?: string | null
          contact_group?: string | null
          contact_type?: string | null
          created_at?: string
          created_date?: string | null
          current_loan_balance?: number | null
          current_rate?: number | null
          deals_lifetime_count?: number
          deals_ytd_count?: number
          do_not_call?: boolean
          email?: string | null
          email_opt_out?: boolean | null
          first_name: string
          form_name?: string | null
          group_tag?: string | null
          home_phone?: string | null
          hot_lead_dismissed?: boolean
          id?: string
          last_activity_date?: string | null
          last_activity_notes?: string | null
          last_activity_type?: string | null
          last_deal_closed_date?: string | null
          last_name: string
          last_outreach_date?: string | null
          last_referral_date?: string | null
          last_touch?: string | null
          last_touch_at?: string | null
          lead_source?: string | null
          mailing_city?: string | null
          mailing_country?: string | null
          mailing_state?: string | null
          mailing_street?: string | null
          mailing_zip?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          phone_mobile?: string | null
          production_tier?: string | null
          realtor_email?: string | null
          realtor_phone?: string | null
          realtor_stage?: string | null
          referral_lifetime_count?: number
          referral_source_notes?: string | null
          referral_type?: string | null
          referral_ytd_count?: number
          referred_by?: string | null
          referred_by_contact_id?: string | null
          referrer?: string | null
          salesforce_created_date?: string | null
          salesforce_id?: string | null
          source?: string | null
          source_page?: string | null
          stage?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          utm_params?: Json | null
        }
        Update: {
          account_name?: string | null
          birthdate?: string | null
          closing_date?: string | null
          co_borrower_birthdate?: string | null
          co_borrower_email?: string | null
          co_borrower_first?: string | null
          co_borrower_last?: string | null
          co_borrower_mobile?: string | null
          company_name?: string | null
          contact_group?: string | null
          contact_type?: string | null
          created_at?: string
          created_date?: string | null
          current_loan_balance?: number | null
          current_rate?: number | null
          deals_lifetime_count?: number
          deals_ytd_count?: number
          do_not_call?: boolean
          email?: string | null
          email_opt_out?: boolean | null
          first_name?: string
          form_name?: string | null
          group_tag?: string | null
          home_phone?: string | null
          hot_lead_dismissed?: boolean
          id?: string
          last_activity_date?: string | null
          last_activity_notes?: string | null
          last_activity_type?: string | null
          last_deal_closed_date?: string | null
          last_name?: string
          last_outreach_date?: string | null
          last_referral_date?: string | null
          last_touch?: string | null
          last_touch_at?: string | null
          lead_source?: string | null
          mailing_city?: string | null
          mailing_country?: string | null
          mailing_state?: string | null
          mailing_street?: string | null
          mailing_zip?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          phone_mobile?: string | null
          production_tier?: string | null
          realtor_email?: string | null
          realtor_phone?: string | null
          realtor_stage?: string | null
          referral_lifetime_count?: number
          referral_source_notes?: string | null
          referral_type?: string | null
          referral_ytd_count?: number
          referred_by?: string | null
          referred_by_contact_id?: string | null
          referrer?: string | null
          salesforce_created_date?: string | null
          salesforce_id?: string | null
          source?: string | null
          source_page?: string | null
          stage?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          utm_params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_referred_by_contact_id_fkey"
            columns: ["referred_by_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          contact_id: string | null
          created_at: string
          doc_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          loan_id: string | null
          mime_type: string | null
          organization_id: string
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          doc_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          loan_id?: string | null
          mime_type?: string | null
          organization_id: string
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          doc_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          loan_id?: string | null
          mime_type?: string | null
          organization_id?: string
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_campaigns: {
        Row: {
          audience: Database["public"]["Enums"]["drip_audience"]
          created_at: string
          description: string | null
          exit_rules: Json
          id: string
          name: string
          org_id: string
          status: Database["public"]["Enums"]["drip_campaign_status"]
          updated_at: string
        }
        Insert: {
          audience: Database["public"]["Enums"]["drip_audience"]
          created_at?: string
          description?: string | null
          exit_rules?: Json
          id?: string
          name: string
          org_id: string
          status?: Database["public"]["Enums"]["drip_campaign_status"]
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["drip_audience"]
          created_at?: string
          description?: string | null
          exit_rules?: Json
          id?: string
          name?: string
          org_id?: string
          status?: Database["public"]["Enums"]["drip_campaign_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_enrollments: {
        Row: {
          campaign_id: string
          cancelled_at: string | null
          cancelled_reason: string | null
          contact_id: string
          created_at: string
          current_step: number
          enrolled_at: string
          enrolled_by: Database["public"]["Enums"]["drip_enrolled_by"]
          id: string
          loan_id: string | null
          next_send_at: string | null
          org_id: string
          removed_at: string | null
          removed_reason: string | null
          status: Database["public"]["Enums"]["drip_enrollment_status"]
          updated_at: string
        }
        Insert: {
          campaign_id: string
          cancelled_at?: string | null
          cancelled_reason?: string | null
          contact_id: string
          created_at?: string
          current_step?: number
          enrolled_at?: string
          enrolled_by?: Database["public"]["Enums"]["drip_enrolled_by"]
          id?: string
          loan_id?: string | null
          next_send_at?: string | null
          org_id: string
          removed_at?: string | null
          removed_reason?: string | null
          status?: Database["public"]["Enums"]["drip_enrollment_status"]
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          cancelled_at?: string | null
          cancelled_reason?: string | null
          contact_id?: string
          created_at?: string
          current_step?: number
          enrolled_at?: string
          enrolled_by?: Database["public"]["Enums"]["drip_enrolled_by"]
          id?: string
          loan_id?: string | null
          next_send_at?: string | null
          org_id?: string
          removed_at?: string | null
          removed_reason?: string | null
          status?: Database["public"]["Enums"]["drip_enrollment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "drip_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_enrollments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_enrollments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_sends: {
        Row: {
          channel: Database["public"]["Enums"]["drip_channel"]
          contact_id: string
          created_at: string
          email_draft_id: string | null
          enrollment_id: string
          generated_body: string | null
          generated_subject: string | null
          id: string
          org_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["drip_send_status"]
          step_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["drip_channel"]
          contact_id: string
          created_at?: string
          email_draft_id?: string | null
          enrollment_id: string
          generated_body?: string | null
          generated_subject?: string | null
          id?: string
          org_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["drip_send_status"]
          step_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["drip_channel"]
          contact_id?: string
          created_at?: string
          email_draft_id?: string | null
          enrollment_id?: string
          generated_body?: string | null
          generated_subject?: string | null
          id?: string
          org_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["drip_send_status"]
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_sends_email_draft_id_fkey"
            columns: ["email_draft_id"]
            isOneToOne: false
            referencedRelation: "email_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_sends_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "drip_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_sends_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_sends_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "drip_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_steps: {
        Row: {
          campaign_id: string
          channel: Database["public"]["Enums"]["drip_channel"]
          created_at: string
          id: string
          name: string
          org_id: string
          requires_approval: boolean
          skeleton: string
          step_order: number
          tone: Database["public"]["Enums"]["drip_tone"]
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["drip_trigger_type"]
          updated_at: string
        }
        Insert: {
          campaign_id: string
          channel?: Database["public"]["Enums"]["drip_channel"]
          created_at?: string
          id?: string
          name: string
          org_id: string
          requires_approval?: boolean
          skeleton: string
          step_order: number
          tone?: Database["public"]["Enums"]["drip_tone"]
          trigger_config?: Json
          trigger_type: Database["public"]["Enums"]["drip_trigger_type"]
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          channel?: Database["public"]["Enums"]["drip_channel"]
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          requires_approval?: boolean
          skeleton?: string
          step_order?: number
          tone?: Database["public"]["Enums"]["drip_tone"]
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["drip_trigger_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "drip_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_steps_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_drafts: {
        Row: {
          automation_id: string | null
          automation_name: string
          body_html: string
          body_preview: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          loan_id: string | null
          organization_id: string
          outlook_draft_id: string | null
          personalization_notes: string | null
          recipient_email: string
          recipient_name: string | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          automation_id?: string | null
          automation_name: string
          body_html: string
          body_preview?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          loan_id?: string | null
          organization_id: string
          outlook_draft_id?: string | null
          personalization_notes?: string | null
          recipient_email: string
          recipient_name?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          automation_id?: string | null
          automation_name?: string
          body_html?: string
          body_preview?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          loan_id?: string | null
          organization_id?: string
          outlook_draft_id?: string | null
          personalization_notes?: string | null
          recipient_email?: string
          recipient_name?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_drafts_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automation_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_drafts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_drafts_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kids: {
        Row: {
          avatar_color: string | null
          avatar_emoji: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          avatar_color?: string | null
          avatar_emoji?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          avatar_color?: string | null
          avatar_emoji?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      lenders: {
        Row: {
          broker_id: string | null
          channel: string | null
          contacts: Json
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          specialty_products: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          broker_id?: string | null
          channel?: string | null
          contacts?: Json
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          specialty_products?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          broker_id?: string | null
          channel?: string | null
          contacts?: Json
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          specialty_products?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lenders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_milestone_events: {
        Row: {
          borrower_email: string | null
          borrower_name: string | null
          created_at: string
          id: string
          loan_id: string
          milestone: string
          processed_at: string | null
          raw_payload: Json | null
          realtor_email: string | null
          realtor_name: string | null
        }
        Insert: {
          borrower_email?: string | null
          borrower_name?: string | null
          created_at?: string
          id?: string
          loan_id: string
          milestone: string
          processed_at?: string | null
          raw_payload?: Json | null
          realtor_email?: string | null
          realtor_name?: string | null
        }
        Update: {
          borrower_email?: string | null
          borrower_name?: string | null
          created_at?: string
          id?: string
          loan_id?: string
          milestone?: string
          processed_at?: string | null
          raw_payload?: Json | null
          realtor_email?: string | null
          realtor_name?: string | null
        }
        Relationships: []
      }
      loan_status_history: {
        Row: {
          arive_loan_id: string
          changed_at: string
          id: string
          loan_id: string | null
          new_status: string | null
          old_status: string | null
          source: string
        }
        Insert: {
          arive_loan_id: string
          changed_at?: string
          id?: string
          loan_id?: string | null
          new_status?: string | null
          old_status?: string | null
          source?: string
        }
        Update: {
          arive_loan_id?: string
          changed_at?: string
          id?: string
          loan_id?: string | null
          new_status?: string | null
          old_status?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_status_history_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          adverse_reason: string | null
          amortization_type: string | null
          application_date: string | null
          appraisal_contingency_date: string | null
          appraisal_date: string | null
          appraisal_delivery_date: string | null
          appraisal_ordered_date: string | null
          appraisal_status: string | null
          appraised_value: number | null
          approval_date: string | null
          apr: number | null
          archive_indicator: boolean | null
          arive_created_at: string | null
          arive_loan_id: string | null
          arive_updated_at: string | null
          arm_adjustment_period: number | null
          arm_initial_fixed_months: number | null
          aus_result: string | null
          back_end_dti: number | null
          base_loan_amount: number | null
          borrower_applicant_type: string | null
          borrower_birthdate: string | null
          borrower_email: string | null
          borrower_first_name: string | null
          borrower_home_phone: string | null
          borrower_last_name: string | null
          borrower_mailing_address: string | null
          borrower_marital_status: string | null
          borrower_name: string | null
          borrower_phone: string | null
          borrower_preferred_language: string | null
          borrower_work_phone: string | null
          broker_fee: number | null
          buydown: boolean | null
          buyer_agent_brokerage: string | null
          buyer_agent_contact_id: string | null
          buyer_agent_email: string | null
          buyer_agent_name: string | null
          buyer_agent_phone: string | null
          buyers_agent_email: string | null
          buyers_agent_name: string | null
          buyers_agent_phone: string | null
          cash_to_close: number | null
          cashout_purpose: string | null
          cd_date: string | null
          cd_status: string | null
          channel: string | null
          client_review_date: string | null
          client_review_status: string | null
          closing_contingency_date: string | null
          closing_date: string | null
          cltv: number | null
          co_borrower_birthdate: string | null
          co_borrower_contact_id: string | null
          co_borrower_email: string | null
          co_borrower_home_phone: string | null
          co_borrower_marital_status: string | null
          co_borrower_name: string | null
          co_borrower_phone: string | null
          co_borrower_work_phone: string | null
          commission_amount: number | null
          commissions: number | null
          compensation_type: string | null
          contact_id: string | null
          contract_data: Json | null
          county: string | null
          created_at: string
          credit_expiration_date: string | null
          credit_import_date: string | null
          credit_order_date: string | null
          credit_score: number | null
          crm_reference_id: string | null
          deep_link_url: string | null
          documentation_type: string | null
          down_payment: number | null
          down_payment_pct: number | null
          earnest_money: number | null
          effective_date: string | null
          employer_name: string | null
          epo_date: string | null
          escrow_agent: string | null
          escrow_contact_id: string | null
          escrow_impounds: number | null
          escrow_officer: string | null
          est_closing_date: string | null
          estimated_closing_date: string | null
          estimated_ltv: number | null
          financed_fees: number | null
          first_payment_date: string | null
          first_time_homebuyer: boolean | null
          flood_insurance_monthly: number | null
          front_end_dti: number | null
          funding_date: string | null
          funding_wire_date: string | null
          funding_wire_status: string | null
          gross_loan_revenue: number | null
          hazard_insurance: number | null
          hcltv: number | null
          hoa_dues: number | null
          hoi_date: string | null
          hoi_monthly: number | null
          hoi_ordered_date: string | null
          hoi_received_date: string | null
          hoi_status: string | null
          id: string
          impound_waiver: boolean | null
          initial_cd_sent_date: string | null
          initial_cd_signed_date: string | null
          initial_le_sent_date: string | null
          initial_le_signed_date: string | null
          intent_to_proceed_date: string | null
          interest_only: boolean | null
          interest_only_term_months: number | null
          interest_rate: number | null
          investor: string | null
          investor_name: string | null
          lead_source: string | null
          lender: string | null
          lender_credits: number | null
          lender_loan_number: string | null
          lender_name: string | null
          lender_nmls: string | null
          lien_position: string | null
          listing_agent_brokerage: string | null
          listing_agent_contact_id: string | null
          listing_agent_email: string | null
          listing_agent_name: string | null
          listing_agent_phone: string | null
          loan_amount: number | null
          loan_contingency_date: string | null
          loan_costs: number | null
          loan_created_date: string | null
          loan_name: string | null
          loan_number: string | null
          loan_program: string | null
          loan_purpose: string | null
          loan_term: number | null
          loan_type: string | null
          lock_date: string | null
          lock_status: string | null
          ltv: number | null
          marketing_campaign: string | null
          mi_monthly: number | null
          mi_upfront: number | null
          middle_score: number | null
          milestone: string | null
          monthly_debts: number | null
          monthly_income: number | null
          monthly_payment: number | null
          mortgage_insurance: number | null
          mortgage_type: string | null
          most_recent_cd_sent_date: string | null
          most_recent_cd_signed_date: string | null
          most_recent_le_sent_date: string | null
          most_recent_le_signed_date: string | null
          net_loan_revenue: number | null
          notes: string | null
          occupancy: string | null
          occupancy_type: string | null
          option_expiration: string | null
          option_fee: number | null
          organization_id: string
          originator_comp: number | null
          payroll_date: string | null
          payroll_status: string | null
          pi_payment: number | null
          piti: number | null
          points: number | null
          position_description: string | null
          pre_approval_expiry_date: string | null
          prepaid_items: number | null
          prepay_penalty: boolean | null
          processor_email: string | null
          processor_name: string | null
          property_address: string | null
          property_attachment_type: string | null
          property_city: string | null
          property_county: string | null
          property_state: string | null
          property_tax: number | null
          property_taxes_monthly: number | null
          property_type: string | null
          property_unit_number: string | null
          property_units: number | null
          property_zip: string | null
          purchase_price: number | null
          rate_lock_date: string | null
          rate_lock_days: number | null
          rate_lock_expiration: string | null
          raw_payload: Json | null
          referral_contact_id: string | null
          referral_source: string | null
          referring_agent_email: string | null
          referring_agent_name: string | null
          referring_agent_phone: string | null
          refinance_type: string | null
          sales_contract_date: string | null
          sales_price: number | null
          self_employed: boolean | null
          seller_concessions: number | null
          seller_credits: number | null
          signed_docs_date: string | null
          signed_docs_status: string | null
          status: string | null
          status_date: string | null
          submission_date: string | null
          synced_at: string | null
          tax_transcript_ordered_date: string | null
          tax_transcript_received_date: string | null
          tbd_address: boolean | null
          term_months: number | null
          title_company: string | null
          title_contact: string | null
          title_contact_id: string | null
          title_date: string | null
          title_email: string | null
          title_ordered_date: string | null
          title_received_date: string | null
          title_status: string | null
          total_closing_costs: number | null
          transaction_coordinator_contact_id: string | null
          transaction_coordinator_email: string | null
          transaction_coordinator_name: string | null
          transaction_coordinator_phone: string | null
          trid_date: string | null
          underwriter_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adverse_reason?: string | null
          amortization_type?: string | null
          application_date?: string | null
          appraisal_contingency_date?: string | null
          appraisal_date?: string | null
          appraisal_delivery_date?: string | null
          appraisal_ordered_date?: string | null
          appraisal_status?: string | null
          appraised_value?: number | null
          approval_date?: string | null
          apr?: number | null
          archive_indicator?: boolean | null
          arive_created_at?: string | null
          arive_loan_id?: string | null
          arive_updated_at?: string | null
          arm_adjustment_period?: number | null
          arm_initial_fixed_months?: number | null
          aus_result?: string | null
          back_end_dti?: number | null
          base_loan_amount?: number | null
          borrower_applicant_type?: string | null
          borrower_birthdate?: string | null
          borrower_email?: string | null
          borrower_first_name?: string | null
          borrower_home_phone?: string | null
          borrower_last_name?: string | null
          borrower_mailing_address?: string | null
          borrower_marital_status?: string | null
          borrower_name?: string | null
          borrower_phone?: string | null
          borrower_preferred_language?: string | null
          borrower_work_phone?: string | null
          broker_fee?: number | null
          buydown?: boolean | null
          buyer_agent_brokerage?: string | null
          buyer_agent_contact_id?: string | null
          buyer_agent_email?: string | null
          buyer_agent_name?: string | null
          buyer_agent_phone?: string | null
          buyers_agent_email?: string | null
          buyers_agent_name?: string | null
          buyers_agent_phone?: string | null
          cash_to_close?: number | null
          cashout_purpose?: string | null
          cd_date?: string | null
          cd_status?: string | null
          channel?: string | null
          client_review_date?: string | null
          client_review_status?: string | null
          closing_contingency_date?: string | null
          closing_date?: string | null
          cltv?: number | null
          co_borrower_birthdate?: string | null
          co_borrower_contact_id?: string | null
          co_borrower_email?: string | null
          co_borrower_home_phone?: string | null
          co_borrower_marital_status?: string | null
          co_borrower_name?: string | null
          co_borrower_phone?: string | null
          co_borrower_work_phone?: string | null
          commission_amount?: number | null
          commissions?: number | null
          compensation_type?: string | null
          contact_id?: string | null
          contract_data?: Json | null
          county?: string | null
          created_at?: string
          credit_expiration_date?: string | null
          credit_import_date?: string | null
          credit_order_date?: string | null
          credit_score?: number | null
          crm_reference_id?: string | null
          deep_link_url?: string | null
          documentation_type?: string | null
          down_payment?: number | null
          down_payment_pct?: number | null
          earnest_money?: number | null
          effective_date?: string | null
          employer_name?: string | null
          epo_date?: string | null
          escrow_agent?: string | null
          escrow_contact_id?: string | null
          escrow_impounds?: number | null
          escrow_officer?: string | null
          est_closing_date?: string | null
          estimated_closing_date?: string | null
          estimated_ltv?: number | null
          financed_fees?: number | null
          first_payment_date?: string | null
          first_time_homebuyer?: boolean | null
          flood_insurance_monthly?: number | null
          front_end_dti?: number | null
          funding_date?: string | null
          funding_wire_date?: string | null
          funding_wire_status?: string | null
          gross_loan_revenue?: number | null
          hazard_insurance?: number | null
          hcltv?: number | null
          hoa_dues?: number | null
          hoi_date?: string | null
          hoi_monthly?: number | null
          hoi_ordered_date?: string | null
          hoi_received_date?: string | null
          hoi_status?: string | null
          id?: string
          impound_waiver?: boolean | null
          initial_cd_sent_date?: string | null
          initial_cd_signed_date?: string | null
          initial_le_sent_date?: string | null
          initial_le_signed_date?: string | null
          intent_to_proceed_date?: string | null
          interest_only?: boolean | null
          interest_only_term_months?: number | null
          interest_rate?: number | null
          investor?: string | null
          investor_name?: string | null
          lead_source?: string | null
          lender?: string | null
          lender_credits?: number | null
          lender_loan_number?: string | null
          lender_name?: string | null
          lender_nmls?: string | null
          lien_position?: string | null
          listing_agent_brokerage?: string | null
          listing_agent_contact_id?: string | null
          listing_agent_email?: string | null
          listing_agent_name?: string | null
          listing_agent_phone?: string | null
          loan_amount?: number | null
          loan_contingency_date?: string | null
          loan_costs?: number | null
          loan_created_date?: string | null
          loan_name?: string | null
          loan_number?: string | null
          loan_program?: string | null
          loan_purpose?: string | null
          loan_term?: number | null
          loan_type?: string | null
          lock_date?: string | null
          lock_status?: string | null
          ltv?: number | null
          marketing_campaign?: string | null
          mi_monthly?: number | null
          mi_upfront?: number | null
          middle_score?: number | null
          milestone?: string | null
          monthly_debts?: number | null
          monthly_income?: number | null
          monthly_payment?: number | null
          mortgage_insurance?: number | null
          mortgage_type?: string | null
          most_recent_cd_sent_date?: string | null
          most_recent_cd_signed_date?: string | null
          most_recent_le_sent_date?: string | null
          most_recent_le_signed_date?: string | null
          net_loan_revenue?: number | null
          notes?: string | null
          occupancy?: string | null
          occupancy_type?: string | null
          option_expiration?: string | null
          option_fee?: number | null
          organization_id: string
          originator_comp?: number | null
          payroll_date?: string | null
          payroll_status?: string | null
          pi_payment?: number | null
          piti?: number | null
          points?: number | null
          position_description?: string | null
          pre_approval_expiry_date?: string | null
          prepaid_items?: number | null
          prepay_penalty?: boolean | null
          processor_email?: string | null
          processor_name?: string | null
          property_address?: string | null
          property_attachment_type?: string | null
          property_city?: string | null
          property_county?: string | null
          property_state?: string | null
          property_tax?: number | null
          property_taxes_monthly?: number | null
          property_type?: string | null
          property_unit_number?: string | null
          property_units?: number | null
          property_zip?: string | null
          purchase_price?: number | null
          rate_lock_date?: string | null
          rate_lock_days?: number | null
          rate_lock_expiration?: string | null
          raw_payload?: Json | null
          referral_contact_id?: string | null
          referral_source?: string | null
          referring_agent_email?: string | null
          referring_agent_name?: string | null
          referring_agent_phone?: string | null
          refinance_type?: string | null
          sales_contract_date?: string | null
          sales_price?: number | null
          self_employed?: boolean | null
          seller_concessions?: number | null
          seller_credits?: number | null
          signed_docs_date?: string | null
          signed_docs_status?: string | null
          status?: string | null
          status_date?: string | null
          submission_date?: string | null
          synced_at?: string | null
          tax_transcript_ordered_date?: string | null
          tax_transcript_received_date?: string | null
          tbd_address?: boolean | null
          term_months?: number | null
          title_company?: string | null
          title_contact?: string | null
          title_contact_id?: string | null
          title_date?: string | null
          title_email?: string | null
          title_ordered_date?: string | null
          title_received_date?: string | null
          title_status?: string | null
          total_closing_costs?: number | null
          transaction_coordinator_contact_id?: string | null
          transaction_coordinator_email?: string | null
          transaction_coordinator_name?: string | null
          transaction_coordinator_phone?: string | null
          trid_date?: string | null
          underwriter_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adverse_reason?: string | null
          amortization_type?: string | null
          application_date?: string | null
          appraisal_contingency_date?: string | null
          appraisal_date?: string | null
          appraisal_delivery_date?: string | null
          appraisal_ordered_date?: string | null
          appraisal_status?: string | null
          appraised_value?: number | null
          approval_date?: string | null
          apr?: number | null
          archive_indicator?: boolean | null
          arive_created_at?: string | null
          arive_loan_id?: string | null
          arive_updated_at?: string | null
          arm_adjustment_period?: number | null
          arm_initial_fixed_months?: number | null
          aus_result?: string | null
          back_end_dti?: number | null
          base_loan_amount?: number | null
          borrower_applicant_type?: string | null
          borrower_birthdate?: string | null
          borrower_email?: string | null
          borrower_first_name?: string | null
          borrower_home_phone?: string | null
          borrower_last_name?: string | null
          borrower_mailing_address?: string | null
          borrower_marital_status?: string | null
          borrower_name?: string | null
          borrower_phone?: string | null
          borrower_preferred_language?: string | null
          borrower_work_phone?: string | null
          broker_fee?: number | null
          buydown?: boolean | null
          buyer_agent_brokerage?: string | null
          buyer_agent_contact_id?: string | null
          buyer_agent_email?: string | null
          buyer_agent_name?: string | null
          buyer_agent_phone?: string | null
          buyers_agent_email?: string | null
          buyers_agent_name?: string | null
          buyers_agent_phone?: string | null
          cash_to_close?: number | null
          cashout_purpose?: string | null
          cd_date?: string | null
          cd_status?: string | null
          channel?: string | null
          client_review_date?: string | null
          client_review_status?: string | null
          closing_contingency_date?: string | null
          closing_date?: string | null
          cltv?: number | null
          co_borrower_birthdate?: string | null
          co_borrower_contact_id?: string | null
          co_borrower_email?: string | null
          co_borrower_home_phone?: string | null
          co_borrower_marital_status?: string | null
          co_borrower_name?: string | null
          co_borrower_phone?: string | null
          co_borrower_work_phone?: string | null
          commission_amount?: number | null
          commissions?: number | null
          compensation_type?: string | null
          contact_id?: string | null
          contract_data?: Json | null
          county?: string | null
          created_at?: string
          credit_expiration_date?: string | null
          credit_import_date?: string | null
          credit_order_date?: string | null
          credit_score?: number | null
          crm_reference_id?: string | null
          deep_link_url?: string | null
          documentation_type?: string | null
          down_payment?: number | null
          down_payment_pct?: number | null
          earnest_money?: number | null
          effective_date?: string | null
          employer_name?: string | null
          epo_date?: string | null
          escrow_agent?: string | null
          escrow_contact_id?: string | null
          escrow_impounds?: number | null
          escrow_officer?: string | null
          est_closing_date?: string | null
          estimated_closing_date?: string | null
          estimated_ltv?: number | null
          financed_fees?: number | null
          first_payment_date?: string | null
          first_time_homebuyer?: boolean | null
          flood_insurance_monthly?: number | null
          front_end_dti?: number | null
          funding_date?: string | null
          funding_wire_date?: string | null
          funding_wire_status?: string | null
          gross_loan_revenue?: number | null
          hazard_insurance?: number | null
          hcltv?: number | null
          hoa_dues?: number | null
          hoi_date?: string | null
          hoi_monthly?: number | null
          hoi_ordered_date?: string | null
          hoi_received_date?: string | null
          hoi_status?: string | null
          id?: string
          impound_waiver?: boolean | null
          initial_cd_sent_date?: string | null
          initial_cd_signed_date?: string | null
          initial_le_sent_date?: string | null
          initial_le_signed_date?: string | null
          intent_to_proceed_date?: string | null
          interest_only?: boolean | null
          interest_only_term_months?: number | null
          interest_rate?: number | null
          investor?: string | null
          investor_name?: string | null
          lead_source?: string | null
          lender?: string | null
          lender_credits?: number | null
          lender_loan_number?: string | null
          lender_name?: string | null
          lender_nmls?: string | null
          lien_position?: string | null
          listing_agent_brokerage?: string | null
          listing_agent_contact_id?: string | null
          listing_agent_email?: string | null
          listing_agent_name?: string | null
          listing_agent_phone?: string | null
          loan_amount?: number | null
          loan_contingency_date?: string | null
          loan_costs?: number | null
          loan_created_date?: string | null
          loan_name?: string | null
          loan_number?: string | null
          loan_program?: string | null
          loan_purpose?: string | null
          loan_term?: number | null
          loan_type?: string | null
          lock_date?: string | null
          lock_status?: string | null
          ltv?: number | null
          marketing_campaign?: string | null
          mi_monthly?: number | null
          mi_upfront?: number | null
          middle_score?: number | null
          milestone?: string | null
          monthly_debts?: number | null
          monthly_income?: number | null
          monthly_payment?: number | null
          mortgage_insurance?: number | null
          mortgage_type?: string | null
          most_recent_cd_sent_date?: string | null
          most_recent_cd_signed_date?: string | null
          most_recent_le_sent_date?: string | null
          most_recent_le_signed_date?: string | null
          net_loan_revenue?: number | null
          notes?: string | null
          occupancy?: string | null
          occupancy_type?: string | null
          option_expiration?: string | null
          option_fee?: number | null
          organization_id?: string
          originator_comp?: number | null
          payroll_date?: string | null
          payroll_status?: string | null
          pi_payment?: number | null
          piti?: number | null
          points?: number | null
          position_description?: string | null
          pre_approval_expiry_date?: string | null
          prepaid_items?: number | null
          prepay_penalty?: boolean | null
          processor_email?: string | null
          processor_name?: string | null
          property_address?: string | null
          property_attachment_type?: string | null
          property_city?: string | null
          property_county?: string | null
          property_state?: string | null
          property_tax?: number | null
          property_taxes_monthly?: number | null
          property_type?: string | null
          property_unit_number?: string | null
          property_units?: number | null
          property_zip?: string | null
          purchase_price?: number | null
          rate_lock_date?: string | null
          rate_lock_days?: number | null
          rate_lock_expiration?: string | null
          raw_payload?: Json | null
          referral_contact_id?: string | null
          referral_source?: string | null
          referring_agent_email?: string | null
          referring_agent_name?: string | null
          referring_agent_phone?: string | null
          refinance_type?: string | null
          sales_contract_date?: string | null
          sales_price?: number | null
          self_employed?: boolean | null
          seller_concessions?: number | null
          seller_credits?: number | null
          signed_docs_date?: string | null
          signed_docs_status?: string | null
          status?: string | null
          status_date?: string | null
          submission_date?: string | null
          synced_at?: string | null
          tax_transcript_ordered_date?: string | null
          tax_transcript_received_date?: string | null
          tbd_address?: boolean | null
          term_months?: number | null
          title_company?: string | null
          title_contact?: string | null
          title_contact_id?: string | null
          title_date?: string | null
          title_email?: string | null
          title_ordered_date?: string | null
          title_received_date?: string | null
          title_status?: string | null
          total_closing_costs?: number | null
          transaction_coordinator_contact_id?: string | null
          transaction_coordinator_email?: string | null
          transaction_coordinator_name?: string | null
          transaction_coordinator_phone?: string | null
          trid_date?: string | null
          underwriter_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_buyer_agent_contact_id_fkey"
            columns: ["buyer_agent_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_co_borrower_contact_id_fkey"
            columns: ["co_borrower_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_escrow_contact_id_fkey"
            columns: ["escrow_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_listing_agent_contact_id_fkey"
            columns: ["listing_agent_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_referral_contact_id_fkey"
            columns: ["referral_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_title_contact_id_fkey"
            columns: ["title_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_transaction_coordinator_contact_id_fkey"
            columns: ["transaction_coordinator_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      los_integrations: {
        Row: {
          active: boolean
          created_at: string
          external_user_email: string | null
          external_user_id: string | null
          id: string
          label: string | null
          organization_id: string
          provider: string
          secret_hash: string
          secret_last_rotated: string
          secret_salt: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          external_user_email?: string | null
          external_user_id?: string | null
          id?: string
          label?: string | null
          organization_id: string
          provider: string
          secret_hash: string
          secret_last_rotated?: string
          secret_salt: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          external_user_email?: string | null
          external_user_id?: string | null
          id?: string
          label?: string | null
          organization_id?: string
          provider?: string
          secret_hash?: string
          secret_last_rotated?: string
          secret_salt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "los_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_activity_log: {
        Row: {
          day_of_week: string
          id: string
          logged_at: string
          organization_id: string | null
          source: string
          task_name: string
          user_id: string
        }
        Insert: {
          day_of_week: string
          id?: string
          logged_at?: string
          organization_id?: string | null
          source?: string
          task_name: string
          user_id: string
        }
        Update: {
          day_of_week?: string
          id?: string
          logged_at?: string
          organization_id?: string | null
          source?: string
          task_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mcc_state: {
        Row: {
          key: string
          organization_id: string | null
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          key?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          key?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "mcc_state_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_communications: {
        Row: {
          body: string | null
          created_at: string
          draft_pushed: boolean
          draft_pushed_at: string | null
          id: string
          milestone_event_id: string | null
          recipient_email: string | null
          recipient_type: string
          subject: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          draft_pushed?: boolean
          draft_pushed_at?: string | null
          id?: string
          milestone_event_id?: string | null
          recipient_email?: string | null
          recipient_type: string
          subject?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          draft_pushed?: boolean
          draft_pushed_at?: string | null
          id?: string
          milestone_event_id?: string | null
          recipient_email?: string | null
          recipient_type?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_communications_milestone_event_id_fkey"
            columns: ["milestone_event_id"]
            isOneToOne: false
            referencedRelation: "loan_milestone_events"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_run_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          level: string
          message: string
          workflow: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          level?: string
          message: string
          workflow: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          level?: string
          message?: string
          workflow?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          contact_id: string | null
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          loan_id: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          loan_id?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          loan_id?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_state: {
        Row: {
          created_at: string
          state: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          state: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          state?: string
          used_at?: string | null
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          application_link: string | null
          arive_webhook_url: string | null
          calendly_link: string | null
          created_at: string
          custom_email_reply_to: string | null
          id: string
          los_type: string | null
          los_verification_mode: string
          mailchimp_list_ids: Json | null
          n8n_webhook_url: string | null
          onboarding_completed: boolean
          onboarding_step: number
          organization_id: string
          outlook_email: string | null
          setup_arive_done: boolean
          setup_automations_done: boolean
          setup_import_done: boolean
          updated_at: string
        }
        Insert: {
          application_link?: string | null
          arive_webhook_url?: string | null
          calendly_link?: string | null
          created_at?: string
          custom_email_reply_to?: string | null
          id?: string
          los_type?: string | null
          los_verification_mode?: string
          mailchimp_list_ids?: Json | null
          n8n_webhook_url?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          organization_id: string
          outlook_email?: string | null
          setup_arive_done?: boolean
          setup_automations_done?: boolean
          setup_import_done?: boolean
          updated_at?: string
        }
        Update: {
          application_link?: string | null
          arive_webhook_url?: string | null
          calendly_link?: string | null
          created_at?: string
          custom_email_reply_to?: string | null
          id?: string
          los_type?: string | null
          los_verification_mode?: string
          mailchimp_list_ids?: Json | null
          n8n_webhook_url?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          organization_id?: string
          outlook_email?: string | null
          setup_arive_done?: boolean
          setup_automations_done?: boolean
          setup_import_done?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_color: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          nmls: string | null
          plan: string
          slug: string | null
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          nmls?: string | null
          plan?: string
          slug?: string | null
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          nmls?: string | null
          plan?: string
          slug?: string | null
        }
        Relationships: []
      }
      outlook_tokens: {
        Row: {
          access_token: string
          created_at: string
          email: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_data: {
        Row: {
          data: Json
          id: string
          organization_id: string
          updated_at: string
          year: number
        }
        Insert: {
          data?: Json
          id?: string
          organization_id: string
          updated_at?: string
          year?: number
        }
        Update: {
          data?: Json
          id?: string
          organization_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          email_signature: string | null
          full_name: string | null
          id: string
          nmls_individual: string | null
          organization_id: string | null
          phone: string | null
          role: string
          states_licensed: string[] | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_signature?: string | null
          full_name?: string | null
          id: string
          nmls_individual?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: string
          states_licensed?: string[] | null
        }
        Update: {
          created_at?: string
          email?: string | null
          email_signature?: string | null
          full_name?: string | null
          id?: string
          nmls_individual?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: string
          states_licensed?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rancho_events: {
        Row: {
          artwork_storage_path: string | null
          artwork_url: string | null
          created_at: string
          description: string
          end_date: string | null
          end_time: string | null
          event_date: string
          event_time: string | null
          gbp_post_error: string | null
          gbp_posted: boolean
          gbp_posted_at: string | null
          id: string
          is_active: boolean
          price: string | null
          publer_post_id: string | null
          sort_order: number
          start_time: string | null
          ticket_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          artwork_storage_path?: string | null
          artwork_url?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          end_time?: string | null
          event_date: string
          event_time?: string | null
          gbp_post_error?: string | null
          gbp_posted?: boolean
          gbp_posted_at?: string | null
          id?: string
          is_active?: boolean
          price?: string | null
          publer_post_id?: string | null
          sort_order?: number
          start_time?: string | null
          ticket_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          artwork_storage_path?: string | null
          artwork_url?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          end_time?: string | null
          event_date?: string
          event_time?: string | null
          gbp_post_error?: string | null
          gbp_posted?: boolean
          gbp_posted_at?: string | null
          id?: string
          is_active?: boolean
          price?: string | null
          publer_post_id?: string | null
          sort_order?: number
          start_time?: string | null
          ticket_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rancho_photos: {
        Row: {
          alt_text: string
          created_at: string
          id: string
          is_active: boolean
          public_url: string
          section: string
          sort_order: number
          storage_path: string
          title: string
          updated_at: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          id?: string
          is_active?: boolean
          public_url: string
          section: string
          sort_order?: number
          storage_path: string
          title: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: string
          is_active?: boolean
          public_url?: string
          section?: string
          sort_order?: number
          storage_path?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rancho_testimonials: {
        Row: {
          attribution: string
          created_at: string
          id: string
          is_active: boolean
          quote: string
          sort_order: number
          stars: number
          updated_at: string
        }
        Insert: {
          attribution?: string
          created_at?: string
          id?: string
          is_active?: boolean
          quote: string
          sort_order?: number
          stars?: number
          updated_at?: string
        }
        Update: {
          attribution?: string
          created_at?: string
          id?: string
          is_active?: boolean
          quote?: string
          sort_order?: number
          stars?: number
          updated_at?: string
        }
        Relationships: []
      }
      resend_webhook_events: {
        Row: {
          contact_id: string | null
          enrollment_id: string | null
          event_id: string
          event_type: string
          payload: Json
          received_at: string
        }
        Insert: {
          contact_id?: string | null
          enrollment_id?: string | null
          event_id: string
          event_type: string
          payload: Json
          received_at?: string
        }
        Update: {
          contact_id?: string | null
          enrollment_id?: string | null
          event_id?: string
          event_type?: string
          payload?: Json
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resend_webhook_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resend_webhook_events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "drip_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          challenge_id: string | null
          drawing_url: string | null
          id: string
          kid_id: string | null
          kid_name: string | null
          response_text: string | null
          submitted_at: string | null
        }
        Insert: {
          challenge_id?: string | null
          drawing_url?: string | null
          id?: string
          kid_id?: string | null
          kid_name?: string | null
          response_text?: string | null
          submitted_at?: string | null
        }
        Update: {
          challenge_id?: string | null
          drawing_url?: string | null
          id?: string
          kid_id?: string | null
          kid_name?: string | null
          response_text?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          borrower_name: string | null
          borrower_qa: Json | null
          created_at: string | null
          current_loan_data: Json | null
          id: string
          mismo_file_url: string | null
          narrative: string | null
          narrative_edited: boolean | null
          organization_id: string
          pdf_url: string | null
          property_address: string | null
          property_value: number | null
          reinvestment_data: Json | null
          results_data: Json | null
          scenario_type: string
          scenarios_data: Json
          share_expires_at: string | null
          share_token: string | null
          source: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          borrower_name?: string | null
          borrower_qa?: Json | null
          created_at?: string | null
          current_loan_data?: Json | null
          id?: string
          mismo_file_url?: string | null
          narrative?: string | null
          narrative_edited?: boolean | null
          organization_id: string
          pdf_url?: string | null
          property_address?: string | null
          property_value?: number | null
          reinvestment_data?: Json | null
          results_data?: Json | null
          scenario_type: string
          scenarios_data: Json
          share_expires_at?: string | null
          share_token?: string | null
          source?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          borrower_name?: string | null
          borrower_qa?: Json | null
          created_at?: string | null
          current_loan_data?: Json | null
          id?: string
          mismo_file_url?: string | null
          narrative?: string | null
          narrative_edited?: boolean | null
          organization_id?: string
          pdf_url?: string | null
          property_address?: string | null
          property_value?: number | null
          reinvestment_data?: Json | null
          results_data?: Json | null
          scenario_type?: string
          scenarios_data?: Json
          share_expires_at?: string | null
          share_token?: string | null
          source?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          resource: string | null
          resource_id: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          resource?: string | null
          resource_id?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          resource?: string | null
          resource_id?: string | null
        }
        Relationships: []
      }
      social_activity: {
        Row: {
          action: string
          created_at: string
          detail: string
          id: string
          organization_id: string
          session_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail: string
          id?: string
          organization_id: string
          session_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string
          id?: string
          organization_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_activity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_drafts: {
        Row: {
          agent_notes: string | null
          classification: string | null
          content: string
          created_at: string
          created_by: string
          format: string | null
          hashtags: string | null
          id: string
          media_urls: string[] | null
          organization_id: string
          pillar: string | null
          platform: string
          publer_post_id: string | null
          rejection_reason: string | null
          scheduled_for: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_notes?: string | null
          classification?: string | null
          content: string
          created_at?: string
          created_by?: string
          format?: string | null
          hashtags?: string | null
          id?: string
          media_urls?: string[] | null
          organization_id: string
          pillar?: string | null
          platform: string
          publer_post_id?: string | null
          rejection_reason?: string | null
          scheduled_for?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_notes?: string | null
          classification?: string | null
          content?: string
          created_at?: string
          created_by?: string
          format?: string | null
          hashtags?: string | null
          id?: string
          media_urls?: string[] | null
          organization_id?: string
          pillar?: string | null
          platform?: string
          publer_post_id?: string | null
          rejection_reason?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_settings: {
        Row: {
          id: string
          key: string
          organization_id: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_admins: {
        Row: {
          created_at: string
          email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          user_id?: string
        }
        Relationships: []
      }
      system_prompts: {
        Row: {
          content: string
          id: string
          name: string
          org_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          id?: string
          name?: string
          org_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_prompts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_items: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_complete: boolean
          is_urgent: boolean
          organization_id: string
          related_contact_id: string | null
          related_loan_id: string | null
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean
          is_urgent?: boolean
          organization_id: string
          related_contact_id?: string | null
          related_loan_id?: string | null
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_complete?: boolean
          is_urgent?: boolean
          organization_id?: string
          related_contact_id?: string | null
          related_loan_id?: string | null
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_items_related_contact_id_fkey"
            columns: ["related_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_items_related_loan_id_fkey"
            columns: ["related_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          key: string
          organization_id: string | null
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          key: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          key?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          mailchimp_status: string
          name: string
          notes: string | null
          source: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          mailchimp_status?: string
          name: string
          notes?: string | null
          source?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          mailchimp_status?: string
          name?: string
          notes?: string | null
          source?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          error: string | null
          id: string
          idempotency_key: string
          loan_id: string | null
          organization_id: string
          processed_at: string | null
          received_at: string
          source: string
          status: string
        }
        Insert: {
          error?: string | null
          id?: string
          idempotency_key: string
          loan_id?: string | null
          organization_id: string
          processed_at?: string | null
          received_at?: string
          source: string
          status?: string
        }
        Update: {
          error?: string | null
          id?: string
          idempotency_key?: string
          loan_id?: string | null
          organization_id?: string
          processed_at?: string | null
          received_at?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_shadow_log: {
        Row: {
          campaign_key: string | null
          classification: string | null
          contact_id: string | null
          exit_rule_triggered: boolean
          id: string
          logged_at: string
          payload: Json
          trigger_source: string
          would_enroll: boolean
        }
        Insert: {
          campaign_key?: string | null
          classification?: string | null
          contact_id?: string | null
          exit_rule_triggered?: boolean
          id?: string
          logged_at?: string
          payload?: Json
          trigger_source: string
          would_enroll?: boolean
        }
        Update: {
          campaign_key?: string | null
          classification?: string | null
          contact_id?: string | null
          exit_rule_triggered?: boolean
          id?: string
          logged_at?: string
          payload?: Json
          trigger_source?: string
          would_enroll?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "workflow_shadow_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_contact_by_email: {
        Args: { lookup_email: string }
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
          loan_id: string
          loan_status: string
          organization_id: string
        }[]
      }
      find_contact_by_phone: {
        Args: { phone_digits: string }
        Returns: {
          contact_type: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          phone_mobile: string
        }[]
      }
      find_duplicate_contacts: { Args: { org_id: string }; Returns: Json }
      find_loan_by_phone: {
        Args: { phone_digits: string }
        Returns: {
          borrower_last_name: string
          contact_id: string
          id: string
          loan_name: string
          status: string
        }[]
      }
      get_due_drip_enrollments: {
        Args: never
        Returns: {
          campaign_audience: string
          campaign_id: string
          campaign_name: string
          channel: string
          closing_date: string
          contact_email: string
          contact_first_name: string
          contact_id: string
          contact_last_name: string
          contact_status: string
          current_step: number
          enrolled_at: string
          enrollment_id: string
          enrollment_status: string
          exit_rules: Json
          last_drip_send_at: string
          loan_amount: number
          loan_id: string
          loan_rate: number
          loan_status: string
          loan_type: string
          org_id: string
          property_address: string
          requires_approval: boolean
          skeleton: string
          step_id: string
          step_name: string
          step_order: number
          tone: string
          trigger_config: Json
          trigger_type: string
        }[]
      }
      get_my_organization_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      increment_scenario_view_count: {
        Args: { p_share_token: string }
        Returns: undefined
      }
    }
    Enums: {
      drip_audience: "past_client" | "lead" | "realtor"
      drip_campaign_status: "active" | "paused" | "archived"
      drip_channel: "email" | "handwritten_card" | "both"
      drip_enrolled_by: "auto" | "manual"
      drip_enrollment_status:
        | "active"
        | "paused"
        | "completed"
        | "removed"
        | "cancelled"
      drip_send_status: "queued" | "approved" | "sent" | "skipped" | "cancelled"
      drip_tone:
        | "straight_shooter"
        | "knowledgeable_friend"
        | "quiet_confidence"
      drip_trigger_type: "relative_days" | "annual_date" | "condition"
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
  public: {
    Enums: {
      drip_audience: ["past_client", "lead", "realtor"],
      drip_campaign_status: ["active", "paused", "archived"],
      drip_channel: ["email", "handwritten_card", "both"],
      drip_enrolled_by: ["auto", "manual"],
      drip_enrollment_status: [
        "active",
        "paused",
        "completed",
        "removed",
        "cancelled",
      ],
      drip_send_status: ["queued", "approved", "sent", "skipped", "cancelled"],
      drip_tone: [
        "straight_shooter",
        "knowledgeable_friend",
        "quiet_confidence",
      ],
      drip_trigger_type: ["relative_days", "annual_date", "condition"],
    },
  },
} as const
