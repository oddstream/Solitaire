# Oddstream Solitaire builder
# Invoke with tclsh bake.tcl [Filename.guts | local | db] from the Solitaire directory
# Using with ActiveTcl 8.6.8 from www.activestate.com
# Using / as a pathname separator, which gets mapped to \

proc buildHtml {htmlFile gutsFile} {
  # Open the file for writing only. Truncate it if it exists. If it does not exist, create a new file.
  # b is same as fconfigure $out -translation binary
  set out [open $htmlFile wb]
  foreach fname [concat build/header.txt $gutsFile build/symbols.svg build/footer.txt] {
    set in [open $fname rb]
    fcopy $in $out
    close $in
  }
  close $out
  puts " ... $htmlFile built"
}

proc xcopy {fname dst} {
  # fname is a file name e.g. "Usk.html"
  # dst is a directory name with a trailing path separator e.g. "c:\\inetpub\\wwwroot\\solitaire"
  # fname is only copied to dst if src is newer than $dst$fname, or $dst$fname does not exist
  # puts "xcopy $fname $dst$fname"
  if { ![file exists $fname] } then {
    puts "$fname does not exist, cannot copy to $dst"
    return 1
  }
  if { [string index $dst end] ne "/" } then {
    set dst [string cat $dst "/"]
  }
  if { [file exists $dst$fname] } then {
    set srcTime [file mtime $fname]
    set dstTime [file mtime $dst$fname]
    if { $srcTime > $dstTime } then {
      puts "Updating $dst$fname"
      file copy -force $fname $dst$fname
    }
  } else {
    puts "Creating $dst$fname"
    file copy $fname $dst$fname
  }
  return 0
}

proc getVersion {fname} {
  set v "0.0.0.0"
  if { [file exists $fname] } then {
    set f [open $fname r]
    while { [gets $f line] != -1 } {
      if { [regexp {\d+\.\d+\.\d+\.\d+} $line value] } then {
          set v $value
          break
      }
    }
    close $f
  }
  puts "$v $fname"
  return $v
}

proc xcompile {fname dst} {
  if { [getVersion $fname] ne [getVersion $dst$fname] } then {
    puts "Compiling to $dst$fname"
    # puts [exec java -jar compiler.jar --version]
    puts [exec java -jar closure-compiler-v20191027.jar --js $fname --language_in ECMASCRIPT_2017 --language_out ECMASCRIPT_2015 --js_output_file $dst$fname]
  }
}

proc publish {dst} {
  foreach htmlFile [glob *.html] {
    xcopy $htmlFile $dst
  }

  foreach pngFile [glob -directory img *.png] {
    xcopy $pngFile $dst
  }

  xcopy Solitaire.css $dst
  xcopy manifest.json $dst
  xcopy index.html $dst
  xcopy chooser.html $dst

  xcopy Solitaire.js $dst
  xcopy chooser.js $dst
  xcopy Random.js $dst
  xcopy Util.js $dst

  # xcompile Solitaire.js $dst
  # xcompile chooser.js $dst
}

# start of doing things here

puts "Oddstream solitaire builder"
puts "Tcl version [info tclversion]"

if { $argc > 0 && [string match -nocase {*.guts} [lindex $argv 0]] } then {
  set gutsList [glob -directory build [lindex $argv 0]]
  puts "Checking $gutsList"
} elseif { $argc > 0 && [string match -nocase {*.html} [lindex $argv 0]] } then {
  set gutsList [glob -directory build [file rootname [lindex $argv 0]].guts]
  puts "Checking $gutsList"
} else {
  set gutsList [glob -directory build *.guts]
  puts "Checking all html are up-to-date"
}

foreach gutsFile $gutsList {
  set htmlFile "[file rootname [file tail $gutsFile]].html"
  set updateHtml false
  if { [file exists $htmlFile] } then {
    set htmlTime [file mtime $htmlFile]
    foreach fname [concat $gutsFile build/header.txt build/symbols.svg build/footer.txt] {
      if { [file mtime $fname] > $htmlTime } then {
        puts -nonewline "$htmlFile needs updating because of $fname"
        set updateHtml true
      }
    }
  } else {
    puts -nonewline "$htmlFile does not exist"
    set updateHtml true
  }
  if { $updateHtml } then {
    buildHtml $htmlFile $gutsFile
  }
}

if { $argc > 0 } then {
  if { [lindex $argv 0] eq "db" || [lindex $argv 0] eq "dropbox" } then {
    puts "Publishing to dropbox"
    publish "c:/Users/oddst/Dropbox/Apps/My.DropPages/oddstream.droppages.com/Public/"
    file copy -force \
      c:/Users/oddst/Dropbox/Apps/My.DropPages/oddstream.droppages.com/Public/index.html \
      c:/Users/oddst/Dropbox/Apps/My.DropPages/oddstream.droppages.com/Content
  } elseif { [lindex $argv 0] eq "git" } then {
    puts "Publishing to local copy of github pages"
    publish "c:/Users/oddst/website/oddstream.github.io/Solitaire/"
    puts "git add --all"
    puts "git commit -m \"version\""
    puts "git push -u origin master"
  }
}

puts "Completed"
