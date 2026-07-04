ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_start_before_end"
CHECK ("startsAt" < "endsAt");

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_no_overlap"
EXCLUDE USING gist (
  tstzrange("startsAt", "endsAt", '[)') WITH &&
)
WHERE ("status" = 'CONFIRMED');
