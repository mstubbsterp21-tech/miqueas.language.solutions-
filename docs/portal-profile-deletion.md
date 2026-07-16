# MLS Portal profile deletion

Client and interpreter profile deletion is available only to MLS administrators from the profile's Danger Zone.

## Confirmation

Permanent deletion requires typing `DELETE` exactly.

## Records that block deletion

A profile cannot be permanently deleted when MLS must retain operational history.

- Client profiles are retained when assignments or client feedback exist.
- Interpreter profiles are retained when assignment records, bids, time entries, or expenses exist.

Use the profile status controls to mark those accounts inactive instead.

## Cleanup for unused profiles

For an unused profile, deletion removes the profile row and cascading profile-only records. The server also removes the profile's uploaded account documents, profile picture, and banner from private Supabase Storage and writes a deletion event to the MLS audit log.

The signed-in administrator's own interpreter profile cannot be deleted through the People directory.
