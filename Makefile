changes ?= $(shell git status --porcelain --untracked-files=no | wc -l)
version ?= $(shell git rev-parse HEAD | head -c 8)
ifeq ($(shell test $(changes) -gt 0; echo $$?),0)
version := $(version)-dev
endif
export_path ?= ./images

# use this to override/set settings
-include Makefile.properties

# image_namespace specifies THIS_PART/namespace/image:tag of the Docker image path
image_registry ?= docker.io
# image_namespace specifies docker.io/THIS_PART/image:tag of the Docker image path
image_namespace ?= zephinzer
# image_name specifies docker.io/namespace/THIS_PART:tag of the Docker image path
image_name ?= cloudagent
# image_name specifies docker.io/namespace/image:THIS_PART of the Docker image path
image_tag ?= $(version)

image_url := $(image_registry)/$(image_namespace)/$(image_name)

binary_name := $(image_name)-$(GOOS)-$(GOARCH)-$(BIN_EXT)

image_name := cloudagent
BIN_EXT = $(if $(filter windows,$(1)),exe,bin)

platforms = \
    linux/amd64 \
    linux/arm64 \
    darwin/amd64 \
    darwin/arm64

version := 1.2.3

init:
	npm install
	go mod vendor

start-agent:
	go run ./agent/cmd/main.go --server-port=8080 --allowed-hostnames="abobus.tech"

start-web:
	cd frontend && npm run dev

define build_template
build-$(1)-$(2):
	@echo "Building for $(1)/$(2)..."
	cd agent && \
	CGO_ENABLED=0 GOOS=$(1) GOARCH=$(2) \
	go build -a -v \
		-ldflags "\
			-s -w \
			-extldflags 'static' \
			-X main.VersionInfo='$(version)' \
		" \
		-o ../scripts/deploy/bin/$(image_name)-$(1)-$(2) ./cmd/main.go
endef


$(foreach p,$(platforms),$(eval $(call build_template,$(word 1,$(subst /, ,$(p))),$(word 2,$(subst /, ,$(p))))))

# Makefile target to build all
build-all: $(foreach p,$(platforms),build-$(word 1,$(subst /, ,$(p)))-$(word 2,$(subst /, ,$(p))))
	@echo "All builds complete!"

deploy-agent:
	ansible-playbook -i scripts/deploy/hosts.ini scripts/deploy/agent-deploy.yaml

build-and-deploy-agent: build-all deploy-agent
	@echo "✅ agent complete!"

build-frontend:
	rm -rf bin
	@bash -c '\
		cd frontend; \
		npm install; \
		npm run build \
	'
	mkdir -p bin/dist && cp -r frontend/dist bin

build-backend:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    	go build -a -v \
    		-ldflags "\
    			-s -w \
    			-extldflags 'static' \
    			-X main.VersionInfo='$(version)' \
    		" \
    		-o ./bin/tgerminal ./tgerminal/cmd/main.go

build-build-atomic: build-frontend build-backend
	@echo "Успешный билд дистров"

build-image:
	docker build -f Dockerfile . -t tgerminal:dev