# Stub: the original Juggernaut realtime push (Node.js + Flash) is dead.
# Replace with Action Cable / Turbo Streams as a follow-up. For now,
# every realtime broadcast is a no-op.
module Juggernaut
  def self.send_to_channel(*) = nil
end
