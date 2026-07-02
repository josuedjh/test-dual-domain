PRODUCTION_IMAGE := ghcr.io/apache-digital-studio/portale-topo-website-app:production
APP_VERSION ?= local

default:
	yarn install

.PHONY: frontend
frontend:
	docker-compose run --rm --service-ports --use-aliases frontend

build:
	docker build --build-arg APP_VERSION=$(APP_VERSION) -t $(PRODUCTION_IMAGE) .

push:
	docker push $(PRODUCTION_IMAGE)

release: build push