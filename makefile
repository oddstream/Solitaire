.RECIPEPREFIX = >
deps := header.txt footer.txt symbols.svg
sources := $(sort $(wildcard *.guts))
objects := $(patsubst %.guts,%.html,$(sources))

%.html: %.guts $(deps)
#>if exist $@ del $@
>@copy /Y header.txt+$(patsubst %.html,%.guts,$@)+symbols.svg+footer.txt $@
#>type header.txt >> $@
#>type $(patsubst %.html,%.guts,$@) >> $@
#>type symbols.svg >> $@
#>type footer.txt >> $@

#$(objects): $(deps)
#	if exist $@ del $@
#	type header.txt >> $@
#	type $(patsubst %.html,%.guts,$@) >> $@
#	type footer.txt >> $@

# TODO try the $(shell ) function
define chain =
make -n $(1)

endef

all:
>$(foreach o,$(objects),$(call chain,$(o)))
    
count:
>@echo $(words $(sources))

guts:
>@echo $(sources)

html:
>@echo $(objects)
