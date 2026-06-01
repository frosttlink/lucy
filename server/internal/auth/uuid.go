package auth

import "regexp"

var uuidRegex = regexp.MustCompile(`^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$`)

func IsValidUUID(s string) bool {
	return uuidRegex.MatchString(s)
}
