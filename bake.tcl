# Oddstream Solitaire builder
# Invoke with tclsh bake.tcl from the Solitaire directory
# Using with ActiveTcl 8.6.8 from www.activestate.com
# Using / as a pathname separator, which seems to get mapped to \

proc lastchar {str} {
  return [string index $str end]
}

proc buildHtml {htmlFile gutsFile} {
  # Open the file for writing only. Truncate it if it exists. If it does not exist, create a new file.
  set out [open $htmlFile w]
  fconfigure $out -translation binary
  foreach fname [concat build/header.txt $gutsFile build/symbols.svg build/footer.txt] {
    set in [open $fname]
    fconfigure $in -translation binary
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
  if { ![file exists $fname] } then {
    puts "$fname does not exist, cannot copy to $dst"
    return 1
  }
  # if { ![regexp {\\$} $dst] } then
  if { [lastchar $dst] ne "/" } then {
    set dst [string cat $dst "/"]
  }
  if { [file exists $dst$fname] } then {
    set srcTime [file mtime $fname]
    set dstTime [file mtime $dst$fname]
    if { $srcTime > $dstTime } then {
      puts "updating $dst$fname"
      file copy -force $fname $dst$fname
    }
  } else {
    puts "creating $dst$fname"
    file copy $fname $dst$fname
  }
  return 0
}

proc publish {dst} {
  foreach htmlFile [glob *.html] {
    xcopy $htmlFile $dst
  }

  xcopy Solitaire.css $dst
  xcopy manifest.json $dst

  puts [exec java -jar compiler.jar --version]
}

foreach gutsFile [glob -directory build *.guts] {
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
  if { [lindex $argv 0] eq "local" } then {
    publish "c:/inetpub/wwwroot/solitaire/"
  }

  if { [lindex argv 0] eq "db" } then {
    publish "c:/Users/oddst/Dropbox/Apps/My.DropPages/oddstream.droppages.com/Content/"
  }
}
