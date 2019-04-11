// +build release

// Build during release - embed all static assets in the binary.
package api

import (
	"html/template"
	"net/http"
	"time"

	api_proto "www.velocidex.com/golang/velociraptor/api/proto"
	"www.velocidex.com/golang/velociraptor/gui/assets"
)

func install_static_assets(config_obj *api_proto.Config, mux *http.ServeMux) {
	dir := "/static/"
	mux.Handle(dir, http.FileServer(assets.HTTP))
}

func GetTemplateHandler(
	config_obj *api_proto.Config, template_name string) (http.Handler, error) {
	data, err := assets.ReadFile(template_name)
	if err != nil {
		return nil, err
	}

	tmpl, err := template.New("").Parse(string(data))
	if err != nil {
		return nil, err
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		args := _templateArgs{
			Timestamp: time.Now().UTC().UnixNano() / 1000,
			Heading:   "Heading",
		}
		err := tmpl.Execute(w, args)
		if err != nil {
			w.WriteHeader(500)
		}
	}), nil
}
