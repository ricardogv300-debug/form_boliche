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
      admin_sucursales: {
        Row: { created_at: string; sucursal_id: string; user_id: string };
        Insert: { created_at?: string; sucursal_id: string; user_id: string };
        Update: { created_at?: string; sucursal_id?: string; user_id?: string };
        Relationships: [
          {
            foreignKeyName: "admin_sucursales_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_sucursales_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["user_id"];
          },
        ];
      };
      admins: {
        Row: { created_at: string; email: string | null; nombre: string | null; rol: string; user_id: string };
        Insert: { created_at?: string; email?: string | null; nombre?: string | null; rol?: string; user_id: string };
        Update: { created_at?: string; email?: string | null; nombre?: string | null; rol?: string; user_id?: string };
        Relationships: [];
      };
      meseros: {
        Row: {
          activo: boolean;
          created_at: string;
          fecha_ingreso: string | null;
          foto_path: string | null;
          id: string;
          nombre: string;
          puesto: string;
          sucursal_id: string;
          telefono: string | null;
          turno: string | null;
        };
        Insert: {
          activo?: boolean;
          created_at?: string;
          fecha_ingreso?: string | null;
          foto_path?: string | null;
          id?: string;
          nombre: string;
          puesto?: string;
          sucursal_id: string;
          telefono?: string | null;
          turno?: string | null;
        };
        Update: {
          activo?: boolean;
          created_at?: string;
          fecha_ingreso?: string | null;
          foto_path?: string | null;
          id?: string;
          nombre?: string;
          puesto?: string;
          sucursal_id?: string;
          telefono?: string | null;
          turno?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meseros_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
        ];
      };
      resenas_lugar: {
        Row: {
          ambiente: number | null;
          atencion: number | null;
          calificacion: number;
          comentario: string | null;
          comida: number | null;
          created_at: string;
          id: string;
          limpieza: number | null;
          nombre: string | null;
          pistas: number | null;
          precio: number | null;
          recomendaria: string | null;
          sucursal_id: string;
          visita: string | null;
        };
        Insert: {
          ambiente?: number | null;
          atencion?: number | null;
          calificacion: number;
          comentario?: string | null;
          comida?: number | null;
          created_at?: string;
          id?: string;
          limpieza?: number | null;
          nombre?: string | null;
          pistas?: number | null;
          precio?: number | null;
          recomendaria?: string | null;
          sucursal_id: string;
          visita?: string | null;
        };
        Update: {
          ambiente?: number | null;
          atencion?: number | null;
          calificacion?: number;
          comentario?: string | null;
          comida?: number | null;
          created_at?: string;
          id?: string;
          limpieza?: number | null;
          nombre?: string | null;
          pistas?: number | null;
          precio?: number | null;
          recomendaria?: string | null;
          sucursal_id?: string;
          visita?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "resenas_lugar_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
        ];
      };
      resenas_meseros: {
        Row: {
          calificacion: number;
          comentario: string | null;
          created_at: string;
          id: string;
          mesero_id: string;
        };
        Insert: {
          calificacion: number;
          comentario?: string | null;
          created_at?: string;
          id?: string;
          mesero_id: string;
        };
        Update: {
          calificacion?: number;
          comentario?: string | null;
          created_at?: string;
          id?: string;
          mesero_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resenas_meseros_mesero_id_fkey";
            columns: ["mesero_id"];
            isOneToOne: false;
            referencedRelation: "meseros";
            referencedColumns: ["id"];
          },
        ];
      };
      quejas_sugerencias: {
        Row: {
          contacto: string | null;
          created_at: string;
          estado: string;
          id: string;
          mensaje: string;
          nombre: string | null;
          prioridad: string;
          resena_id: string | null;
          sucursal_id: string;
          tipo: string;
          updated_at: string;
        };
        Insert: {
          contacto?: string | null;
          created_at?: string;
          estado?: string;
          id?: string;
          mensaje: string;
          nombre?: string | null;
          prioridad?: string;
          resena_id?: string | null;
          sucursal_id: string;
          tipo: string;
          updated_at?: string;
        };
        Update: {
          contacto?: string | null;
          created_at?: string;
          estado?: string;
          id?: string;
          mensaje?: string;
          nombre?: string | null;
          prioridad?: string;
          resena_id?: string | null;
          sucursal_id?: string;
          tipo?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quejas_sugerencias_resena_id_fkey";
            columns: ["resena_id"];
            isOneToOne: false;
            referencedRelation: "resenas_lugar";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quejas_sugerencias_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
        ];
      };
      seguimientos: {
        Row: {
          created_at: string;
          estado_nuevo: string | null;
          id: string;
          nota: string | null;
          queja_id: string;
          tipo: string;
        };
        Insert: {
          created_at?: string;
          estado_nuevo?: string | null;
          id?: string;
          nota?: string | null;
          queja_id: string;
          tipo: string;
        };
        Update: {
          created_at?: string;
          estado_nuevo?: string | null;
          id?: string;
          nota?: string | null;
          queja_id?: string;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seguimientos_queja_id_fkey";
            columns: ["queja_id"];
            isOneToOne: false;
            referencedRelation: "quejas_sugerencias";
            referencedColumns: ["id"];
          },
        ];
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
