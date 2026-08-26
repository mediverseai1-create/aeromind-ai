// Hand-written to match supabase/migrations/*.sql. If the schema changes,
// update this file and the migration together — there is no CLI codegen
// step wired up in this project.

export type Cadence = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "biannual" | "annual";
export type Plan = "starter" | "growth" | "scale" | "enterprise";
export type MembershipRole = "owner" | "admin" | "member";
export type DatasetStatus = "uploaded" | "validated" | "processing" | "ready" | "error";
export type AnalysisStatus = "processing" | "ready" | "error";
export type QuestionStatus = "pending" | "answered" | "error";
export type SubscriptionStatus = "active" | "pending_payment" | "inactive";

export type CreditPlanId = "free" | "professional" | "business";
export type WalletSubscriptionStatus = "active" | "past_due" | "canceled";
export type TransactionKind = "reserve" | "monthly_reset" | "grant" | "adjustment";
export type TransactionStatus = "pending" | "committed" | "released";
export type OperationKey =
  | "sales_briefing"
  | "next_best_actions"
  | "ask_aeromind"
  | "conversation_analysis"
  | "follow_up_email_individual"
  | "follow_up_campaign_per_recipient"
  | "lead_scoring"
  | "system";
export type NextBestActionType =
  | "contact_customer"
  | "follow_up_lead"
  | "re_engage_dormant"
  | "review_opportunity"
  | "address_risk"
  | "other";
export type NextBestActionPriority = "low" | "medium" | "high";
export type NextBestActionStatus = "open" | "dismissed" | "done";

export type LifecycleStage = "lead" | "prospect" | "opportunity" | "customer" | "previous_customer" | "dormant";
export type LeadStatus = "new" | "qualified" | "disqualified" | "converted";
export type OpportunityStage = "qualifying" | "proposal" | "negotiation" | "won" | "lost";
export type FollowUpStatus = "pending" | "sent" | "snoozed" | "done" | "skipped";
export type FollowUpCampaignStatus = "draft" | "running" | "completed" | "failed";

export type ConversationSourceType = "recording" | "transcript";
export type ConversationStatus = "uploaded" | "processing" | "analyzed" | "error";
export type BuyerIntent = "high" | "medium" | "low";
export type Sentiment = "positive" | "neutral" | "concerned" | "mixed";

export type LeadCandidateSource = "manual" | "dataset_seed" | "external_provider";
export type LeadCandidateStatus = "candidate" | "contacted" | "converted_to_lead" | "dismissed";

type Table<Row, RequiredInsert extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, RequiredInsert>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          full_name: string | null;
          email: string;
          created_at: string;
          updated_at: string;
        },
        "id" | "email"
      >;
      organizations: Table<
        {
          id: string;
          name: string;
          industry: string | null;
          company_size: string | null;
          country: string | null;
          cadence: Cadence;
          plan: Plan;
          created_by: string;
          created_at: string;
          updated_at: string;
        },
        "name" | "created_by"
      >;
      memberships: Table<
        {
          id: string;
          org_id: string;
          user_id: string;
          role: MembershipRole;
          created_at: string;
        },
        "org_id" | "user_id"
      >;
      datasets: Table<
        {
          id: string;
          org_id: string;
          uploaded_by: string;
          file_name: string;
          storage_path: string;
          row_count: number;
          column_map: Record<string, string | null>;
          status: DatasetStatus;
          error_message: string | null;
          created_at: string;
        },
        "org_id" | "uploaded_by" | "file_name" | "storage_path"
      >;
      dataset_rows: Table<
        {
          id: number;
          dataset_id: string;
          org_id: string;
          row_date: string | null;
          product: string | null;
          customer: string | null;
          region: string | null;
          rep: string | null;
          quantity: number | null;
          unit_price: number | null;
          revenue: number | null;
          raw: Record<string, unknown> | null;
        },
        "dataset_id" | "org_id"
      >;
      analyses: Table<
        {
          id: string;
          org_id: string;
          dataset_id: string;
          cadence: Cadence;
          period_start: string | null;
          period_end: string | null;
          metrics: Record<string, unknown>;
          report_md: string | null;
          strategy_md: string | null;
          action_plan_md: string | null;
          ai_generated: boolean;
          status: AnalysisStatus;
          created_by: string;
          created_at: string;
        },
        "org_id" | "dataset_id" | "cadence" | "created_by"
      >;
      questions: Table<
        {
          id: string;
          org_id: string;
          asked_by: string;
          question: string;
          answer: string | null;
          grounded_data: Record<string, unknown> | null;
          status: QuestionStatus;
          created_at: string;
        },
        "org_id" | "asked_by" | "question"
      >;
      subscriptions: Table<
        {
          id: string;
          org_id: string;
          plan: CreditPlanId;
          status: SubscriptionStatus;
          updated_at: string;
        },
        "org_id"
      >;

      // ---- credits (0003) ----
      credit_plans: Table<
        {
          id: CreditPlanId;
          display_name: string;
          monthly_credits: number;
          price_usd: number;
          is_active: boolean;
          created_at: string;
        },
        "id" | "display_name" | "monthly_credits" | "price_usd"
      >;
      credit_wallets: Table<
        {
          id: string;
          org_id: string;
          plan: CreditPlanId;
          billing_cycle_start: string;
          billing_cycle_end: string;
          monthly_allowance: number;
          allocated: number;
          consumed: number;
          subscription_status: WalletSubscriptionStatus;
          updated_at: string;
        },
        "org_id"
      >;
      ai_operation_costs: Table<
        {
          operation_key: OperationKey;
          display_name: string;
          credit_cost: number;
          is_active: boolean;
          updated_at: string;
        },
        "operation_key" | "display_name" | "credit_cost"
      >;
      credit_transactions: Table<
        {
          id: string;
          org_id: string;
          wallet_id: string;
          operation_key: OperationKey;
          amount: number;
          kind: TransactionKind;
          status: TransactionStatus;
          idempotency_key: string;
          related_id: string | null;
          created_by: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        },
        "org_id" | "wallet_id" | "operation_key" | "amount" | "kind" | "idempotency_key"
      >;
      billing_events: Table<
        {
          id: string;
          source: string;
          received_at: string;
          raw_payload: Record<string, unknown>;
          headers: Record<string, unknown> | null;
          matched_org_id: string | null;
          matched_email: string | null;
          outcome: "applied" | "ignored_duplicate" | "no_matching_org" | "invalid_signature" | "error";
          error_detail: string | null;
          dedupe_key: string | null;
          created_at: string;
        },
        "raw_payload" | "outcome"
      >;

      // ---- briefing / next best actions (0004) ----
      next_best_actions: Table<
        {
          id: string;
          org_id: string;
          analysis_id: string;
          title: string;
          reason: string;
          action_type: NextBestActionType;
          target_ref: Record<string, unknown>;
          priority: NextBestActionPriority;
          status: NextBestActionStatus;
          created_at: string;
        },
        "org_id" | "analysis_id" | "title" | "reason"
      >;

      // ---- phase 2: CRM (0005) ----
      accounts: Table<
        {
          id: string;
          org_id: string;
          name: string;
          lifecycle_stage: LifecycleStage;
          source: "dataset_import" | "manual" | "lead_finder" | null;
          primary_contact_name: string | null;
          primary_contact_email: string | null;
          linked_customer_key: string | null;
          last_activity_at: string | null;
          created_at: string;
          updated_at: string;
        },
        "org_id" | "name"
      >;
      leads: Table<
        {
          id: string;
          org_id: string;
          company_name: string;
          contact_name: string | null;
          contact_email: string | null;
          status: LeadStatus;
          qualification_notes: string | null;
          converted_account_id: string | null;
          created_at: string;
          updated_at: string;
        },
        "org_id" | "company_name"
      >;
      opportunities: Table<
        {
          id: string;
          org_id: string;
          account_id: string;
          name: string;
          stage: OpportunityStage;
          value: number | null;
          expected_close_date: string | null;
          risk_notes: string | null;
          created_at: string;
          updated_at: string;
        },
        "org_id" | "account_id" | "name"
      >;
      follow_up_campaigns: Table<
        {
          id: string;
          org_id: string;
          name: string;
          filter_criteria: Record<string, unknown>;
          status: FollowUpCampaignStatus;
          created_by: string | null;
          created_at: string;
        },
        "org_id" | "name"
      >;
      follow_ups: Table<
        {
          id: string;
          org_id: string;
          account_id: string | null;
          opportunity_id: string | null;
          campaign_id: string | null;
          reason: string;
          suggested_channel: "email" | "call" | "other" | null;
          suggested_message: string | null;
          due_at: string | null;
          status: FollowUpStatus;
          generated_by: "ai" | "manual";
          created_at: string;
          updated_at: string;
        },
        "org_id" | "reason"
      >;

      // ---- phase 3: conversations (0006) ----
      conversations: Table<
        {
          id: string;
          org_id: string;
          account_id: string | null;
          opportunity_id: string | null;
          uploaded_by: string | null;
          source_type: ConversationSourceType;
          storage_path: string | null;
          transcript_text: string | null;
          status: ConversationStatus;
          occurred_at: string | null;
          created_at: string;
        },
        "org_id" | "source_type"
      >;
      conversation_insights: Table<
        {
          id: string;
          conversation_id: string;
          org_id: string;
          summary: string | null;
          key_topics: Record<string, unknown> | null;
          buyer_intent: BuyerIntent | null;
          buyer_intent_evidence: Record<string, unknown> | null;
          sentiment: Sentiment | null;
          objections: Record<string, unknown> | null;
          questions_asked: Record<string, unknown> | null;
          commitments: Record<string, unknown> | null;
          next_steps: Record<string, unknown> | null;
          follow_up_date: string | null;
          decision_criteria: Record<string, unknown> | null;
          competitors_mentioned: Record<string, unknown> | null;
          people_mentioned: Record<string, unknown> | null;
          deal_risks: Record<string, unknown> | null;
          opportunities: Record<string, unknown> | null;
          recommended_next_action: string | null;
          created_at: string;
        },
        "conversation_id" | "org_id"
      >;

      // ---- phase 4: lead finder (0007) ----
      ideal_customer_profiles: Table<
        {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          derived_signals: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        "org_id" | "name"
      >;
      lead_candidates: Table<
        {
          id: string;
          org_id: string;
          icp_id: string | null;
          company_name: string;
          source: LeadCandidateSource;
          fit_score: number | null;
          fit_reasoning: string | null;
          status: LeadCandidateStatus;
          converted_lead_id: string | null;
          created_at: string;
          updated_at: string;
        },
        "org_id" | "company_name"
      >;
    };
    Views: Record<string, never>;
    Functions: {
      reserve_credits: {
        Args: { p_org_id: string; p_operation_key: OperationKey; p_idempotency_key: string };
        Returns: { transaction_id: string | null; reserved: boolean; remaining: number }[];
      };
      commit_credits: {
        Args: { p_transaction_id: string; p_related_id?: string | null };
        Returns: undefined;
      };
      release_credits: {
        Args: { p_transaction_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      run_credit_maintenance: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
  };
}
