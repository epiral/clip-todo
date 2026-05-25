.PHONY: ui dev clean

# Build frontend (→ web/)
ui:
	bun run build

# Dev mode: install deps + build
dev:
	bun install
	bun run build
	@echo "Ready. Run with: bun run clip.ts --web 3000"

clean:
	rm -rf web/ node_modules/
