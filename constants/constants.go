package constants

const (
	VERSION                    = "0.2.8"
	ENROLLMENT_WELL_KNOWN_FLOW = "aff4:/flows/E:Enrol"
	MONITORING_WELL_KNOWN_FLOW = FLOW_PREFIX + "Monitoring"

	// Temporary attribute
	AFF4_ATTR = "aff4:data"

	FLOW_PREFIX             = "F."
	FOREMAN_WELL_KNOWN_FLOW = "aff4:/flows/E.Foreman"
	HUNTS_URN               = "aff4:/hunts"
	HUNT_PREFIX             = "H."

	// The GUI uses this as the client index.
	CLIENT_INDEX_URN = "aff4:/client_index/"

	USER_URN = "aff4:/users/"

	// Well known flows - Request ID:
	LOG_SINK uint64 = 980

	TransferWellKnownFlowId = 5

	// Some special built in artifacts.
	FileFinderArtifactName = "System.Flow.FileFinder"

	// Filestore paths for artifacts must begin with this prefix.
	ARTIFACT_DEFINITION         = "/artifact_definitions/custom"
	BUILTIN_ARTIFACT_DEFINITION = "/artifact_definitions/builtin"

	// Messages to the client which we dont care about their responses.
	IgnoreResponseState = uint64(101)

	FRONTEND_NAME = "VelociraptorServer"
)
