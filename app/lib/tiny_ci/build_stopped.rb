module TinyCI
  # Sentinel raised from inside a shell run loop when a stop request has
  # flipped the build's status to "stopping". Build#build! catches it and
  # finalizes the build as "stopped".
  class BuildStopped < StandardError; end
end
