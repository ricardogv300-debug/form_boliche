// Generado con el MCP de Supabase (generate_typescript_types). Regenerar si cambia el esquema.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      admins: {
        Row: { created_at: string; user_id: string };
        Insert: { created_at?: string; user_id: string };
        Update: { created_at?: string; user_id?: string };
        Relationships: [];
      };
      reportes: {
        Row: {
          calificacion: string;
          created_at: string;
          descripcion: string;
          dia_semana: string;
          horario: string;
          id: string;
          nombre: string;
          pista: number;
          sucursal_id: string;
        };
        Insert: {
          calificacion: string;
          created_at?: string;
          descripcion: string;
          dia_semana: string;
          horario: string;
          id?: string;
          nombre: string;
          pista: number;
          sucursal_id: string;
        };
        Update: {
          calificacion?: string;
          created_at?: string;
          descripcion?: string;
          dia_semana?: string;
          horario?: string;
          id?: string;
          nombre?: string;
          pista?: number;
          sucursal_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reportes_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
        ];
      };
      sucursales: {
        Row: {
          activa: boolean;
          created_at: string;
          id: string;
          nombre: string;
          num_pistas: number;
          slug: string;
        };
        Insert: {
          activa?: boolean;
          created_at?: string;
          id?: string;
          nombre: string;
          num_pistas: number;
          slug: string;
        };
        Update: {
          activa?: boolean;
          created_at?: string;
          id?: string;
          nombre?: string;
          num_pistas?: number;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      estadisticas_reportes: {
        Args: { p_sucursal?: string; p_dias?: number };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
