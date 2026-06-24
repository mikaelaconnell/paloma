import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Trip, TripMember } from "../types";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const memberColors = [
  "#c2703e",
  "#1e3a5f",
  "#6b7f3b",
  "#f4d35e",
  "#3d94d1",
  "#a35a2e",
  "#e69a5c",
  "#2e6b9e",
];

export function useTrips(userId: string | undefined) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: memberRows } = await supabase
      .from("trip_members")
      .select("trip_id")
      .eq("user_id", userId);

    if (!memberRows || memberRows.length === 0) {
      setTrips([]);
      setLoading(false);
      return;
    }

    const tripIds = memberRows.map((r) => r.trip_id);
    const { data } = await supabase
      .from("trips")
      .select("*")
      .in("id", tripIds)
      .order("start_date", { ascending: true });

    setTrips(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const createTrip = async (trip: {
    name: string;
    destination: string;
    description?: string;
    start_date: string;
    end_date: string;
  }) => {
    if (!userId) return null;

    const inviteCode = generateInviteCode();
    const { data, error } = await supabase
      .from("trips")
      .insert({
        ...trip,
        invite_code: inviteCode,
        created_by: userId,
      })
      .select()
      .single();

    if (error || !data) return null;

    // Add creator as owner
    await supabase.from("trip_members").insert({
      trip_id: data.id,
      user_id: userId,
      role: "owner",
      color: memberColors[0],
    });

    await fetchTrips();
    return data as Trip;
  };

  const joinTrip = async (inviteCode: string) => {
    if (!userId) return { error: "Not logged in" };

    const { data: trip } = await supabase
      .from("trips")
      .select("*")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (!trip) return { error: "Invalid invite code" };

    // Check if already a member
    const { data: existing } = await supabase
      .from("trip_members")
      .select("id")
      .eq("trip_id", trip.id)
      .eq("user_id", userId)
      .single();

    if (existing) return { error: "You're already in this trip!" };

    // Get member count for color assignment
    const { count } = await supabase
      .from("trip_members")
      .select("*", { count: "exact", head: true })
      .eq("trip_id", trip.id);

    await supabase.from("trip_members").insert({
      trip_id: trip.id,
      user_id: userId,
      role: "member",
      color: memberColors[(count || 0) % memberColors.length],
    });

    await fetchTrips();
    return { trip: trip as Trip };
  };

  return { trips, loading, createTrip, joinTrip, refresh: fetchTrips };
}
