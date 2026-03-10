.PHONY: ui dev deploy package clean

SERVER := http://localhost:9875
TOKEN  := changeme

# Build frontend (→ web/)
ui:
	pnpm build

# Init local data + build
dev: ui
	@mkdir -p data
	@[ -f data/todo.db ] || cp seed/todo.db data/todo.db
	@echo "Ready. Pinix dev mode reads this workdir directly."

# Build all (dev workdir mode)
deploy: ui
	@echo "Done. web/ updated."

# Package into .clip for install/upgrade
package: ui
	@mkdir -p dist
	@rm -f dist/todo.clip
	cd . && zip -r dist/todo.clip clip.yaml commands/ web/ seed/ -x '*.DS_Store'
	@echo "Package: dist/todo.clip"
	@echo "  Install:  pinix clip install dist/todo.clip --server $(SERVER) --token $(TOKEN)"
	@echo "  Upgrade:  pinix clip upgrade dist/todo.clip --server $(SERVER) --token $(TOKEN)"

clean:
	rm -rf data/ web/ dist/
