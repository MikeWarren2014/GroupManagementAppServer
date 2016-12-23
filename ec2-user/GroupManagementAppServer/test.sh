echo 'number of arguments: ' $#
echo $1 $2
echo 'All arguments: '  $@
a='test'
echo $([[ $a ]] && echo $a || echo 4)

