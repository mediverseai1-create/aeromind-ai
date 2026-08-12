// Hand-written to match supabase/migrations/0001_init.sql. If the schema
// changes, update this file and the migration together — there is no CLI
// codegen step wired up in this project.

export type Cadence = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "biannual" | "annual";
export type Plan = "starter" | "growth" | "scale" | "enterprise";
export type MembershipRole = "owner" | "admin" | "member";
export type DatasetStatus = "uploaded" | "validated" | "processing" | "ready" | "error";
export type AnalysisStatus = "processing" | "ready" | "error";
export type QuestionStatus = "pending" | "answered" | "error";
export type SubscriptionStatus = "active" | "pending_payment" | "inactive";

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
          plan: Plan;
          status: SubscriptionStatus;
          updated_at: string;
        },
        "org_id"
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
