TEX     := cv
LATEX   := pdflatex
BIBER   := biber
FLAGS   := -interaction=nonstopmode -halt-on-error

SRCDIR  := src
ASSETS  := assets
BUILDDIR := build

TEXLIVE_DIR := $(HOME)/texlive/2026
TEXLIVE_BIN := $(TEXLIVE_DIR)/bin/universal-darwin
TLMGR       := $(TEXLIVE_BIN)/tlmgr

export TEXINPUTS  := ./$(SRCDIR)/:./$(ASSETS)//:
export BIBINPUTS  := ./$(SRCDIR)/:

PACKAGES := fontawesome5 pdfx accsupp paracol roboto lato biblatex biber \
            latexmk xmpincl koma-script tikzfill multirow changepage dashrule \
            ifmtarg enumitem academicons simpleicons tcolorbox environ \
            trimspaces adjustbox collectbox fontaxes mweights biblatex-ieee

.PHONY: all build rebuild clean distclean install check

all: build

# Full build: pdflatex -> biber -> pdflatex x2
build:
	@mkdir -p $(BUILDDIR)
	$(LATEX) $(FLAGS) -output-directory=$(BUILDDIR) $(SRCDIR)/$(TEX).tex
	$(BIBER) --input-directory=$(SRCDIR) $(BUILDDIR)/$(TEX)
	$(LATEX) $(FLAGS) -output-directory=$(BUILDDIR) $(SRCDIR)/$(TEX).tex
	$(LATEX) $(FLAGS) -output-directory=$(BUILDDIR) $(SRCDIR)/$(TEX).tex
	@echo "Done -> $(BUILDDIR)/$(TEX).pdf"

# Fast rebuild: single pdflatex pass (skip biber)
rebuild:
	@mkdir -p $(BUILDDIR)
	$(LATEX) $(FLAGS) -output-directory=$(BUILDDIR) $(SRCDIR)/$(TEX).tex
	@echo "Done -> $(BUILDDIR)/$(TEX).pdf"

# Remove build artifacts but keep the PDF
clean:
	@if [ -f $(BUILDDIR)/$(TEX).pdf ]; then \
		mv $(BUILDDIR)/$(TEX).pdf /tmp/$(TEX).pdf.keep; \
		rm -rf $(BUILDDIR); \
		mkdir -p $(BUILDDIR); \
		mv /tmp/$(TEX).pdf.keep $(BUILDDIR)/$(TEX).pdf; \
	else \
		rm -rf $(BUILDDIR); \
	fi
	@echo "Cleaned $(BUILDDIR)/ (kept $(TEX).pdf)"

# Remove everything including the PDF
distclean:
	rm -rf $(BUILDDIR)
	@echo "Removed $(BUILDDIR)/"

# Install TeX Live and all required packages
install:
	@if [ -x "$(TEXLIVE_BIN)/pdflatex" ]; then \
		echo "TeX Live already installed at $(TEXLIVE_DIR)"; \
	else \
		echo "Installing TeX Live..."; \
		cd /tmp && \
		curl -L -o install-tl-unx.tar.gz \
			https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz && \
		tar xzf install-tl-unx.tar.gz && \
		cd install-tl-*/ && \
		printf '%s\n' \
			"selected_scheme scheme-small" \
			"TEXDIR $(TEXLIVE_DIR)" \
			"TEXMFLOCAL $(HOME)/texlive/texmf-local" \
			"TEXMFSYSCONFIG $(TEXLIVE_DIR)/texmf-config" \
			"TEXMFSYSVAR $(TEXLIVE_DIR)/texmf-var" \
			"TEXMFCONFIG $(HOME)/.texlive/texmf-config" \
			"TEXMFHOME $(HOME)/texmf" \
			"TEXMFVAR $(HOME)/.texlive/texmf-var" \
			"binary_x86_64-linux 0" \
			"binary_universal-darwin 1" \
			"instopt_adjustpath 0" \
			"instopt_adjustrepo 1" \
			"instopt_letter 0" \
			"tlpdbopt_autobackup 1" \
			"tlpdbopt_install_docfiles 0" \
			"tlpdbopt_install_srcfiles 0" \
		> /tmp/texlive.profile && \
		perl install-tl --profile=/tmp/texlive.profile; \
	fi
	$(TLMGR) install $(PACKAGES)
	@echo ""
	@echo "Add to your shell profile:"
	@echo '  export PATH="$(TEXLIVE_BIN):$$PATH"'

# Verify tools are on PATH
check:
	@echo "pdflatex: $$(which pdflatex 2>/dev/null || echo 'NOT FOUND')"
	@echo "biber:    $$(which biber 2>/dev/null || echo 'NOT FOUND')"
	@echo "latexmk:  $$(which latexmk 2>/dev/null || echo 'NOT FOUND')"
