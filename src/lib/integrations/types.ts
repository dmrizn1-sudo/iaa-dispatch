export type CallWebhookPayload = {
  event: "call.approved" | "call.assigned";
  sent_at: string; // ISO
  call: {
    id: string;
    call_no: number;
    created_at: string;
    created_by: string;
    status: string;
    date: string;
    time: string;
    call_type: string;
    first_name: string;
    last_name: string;
    national_id: string;
    from_place: string;
    from_department: string | null;
    to_place: string;
    to_department: string | null;
    health_fund: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    commitment_no: string | null;
    driver: string | null;
    vehicle_no: string | null;
    notes: string | null;
    closed_at: string | null;
  };
  assignment?: {
    driver_name: string;
    driver_phone: string;
    vehicle_number: string;
    vehicle_plate: string;
  } | null;
};

