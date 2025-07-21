ifeq ($(OS),Windows_NT)
	COPY_CMD = copy
	MKDIR = mkdir
	BUILD_CMD = --bundles dmg
else
	COPY_CMD = cp -r
	MKDIR = mkdir -p
	BUILD_CMD = 
endif

BUILD_PATH = src-tauri/target/release/bundle


# 生成密钥
generatekey:
	yarn tauri signer generate -w key/myapp.key

build:
	export TAURI_SIGNING_PRIVATE_KEY="$$(tr -d '\n' < key/myapp.key)"; \
	export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="Mxy123820"; \
	yarn tauri build $(BUILD_CMD)

	$(MKDIR) package

	$(COPY_CMD) $(BUILD_PATH)/**/*.dmg package/ 2>/dev/null || true
	$(COPY_CMD) $(BUILD_PATH)/**/*.msi package/ 2>/dev/null || true
	$(COPY_CMD) $(BUILD_PATH)/**/*.tar.gz package/ 2>/dev/null || true
	$(COPY_CMD) $(BUILD_PATH)/**/*.tar.gz.sig package/ 2>/dev/null || true

dev:
	yarn tauri dev
