#!/usr/bin/env bash

LOGS_DIR="/honeyserver/logs/"

LOGS_FILE=
EXEC_FILE=
NAME=

function start() {

	[[ checkVars == 1 ]] && return
	
	echo ${NAME}
	
    session_count=`screen -ls ${NAME} | grep ${NAME} | wc -l`
	if [[ $session_count > 0 ]]; then
		echo -e "${YELLOW}Server screen is already running.${NOCOLOR}"
		return
	fi

	scrollLog
	
config="logfile ${LOGS_DIR}/${NAME}.log
logfile flush 1
log on
sessionname ${NAME}
";
echo "$config" > /tmp/${NAME}.conf

	screen -c /tmp/${NAME}.conf -dmL /honeyserver/server.sh loop
	sleep 0.5
	
	count=`screen -ls ${NAME} | grep ${NAME} | wc -l`
	echo $count
	if [[ $count -eq 0 ]]; then
		echo -e "${RED}ERROR start ${NAME} ${NOCOLOR}"
	else
		echo -e "${GREEN}Success start ${NAME} ${NOCOLOR}"
	fi
}

function monitor() {
	screen -x ${NAME}
}

function checkVars() {
	[[ -z $LOGS_FILE ]] && echo -e "No logs set" && return 1
	[[ -z $EXEC_FILE ]] && echo -e "No exec file set" && return 1
	[[ -z $NAME ]] && echo -e "No name set" && return 1
}

function setVars() {
	
	NAME="honeyserver"
  EXEC_DIR="/honeyserver/"
  EXEC_FILE="start.sh"
  LOGS_FILE="${LOGS_DIR}${NAME}.log"
	
	cd $EXEC_DIR
}

function loop() {
	
	while : ; do
		
		./$EXEC_FILE
		
		echo -e "${LGRAY}The command will be started after timeout ${NOCOLOR}"
		sleep 5
    done
}

function stop() {	
    screens=`screen -ls ${NAME} | grep -E "[0-9]+\.${NAME}" | cut -d. -f1 | awk '{print $1}'`

	if [[ -z $screens ]]; then
		echo "No ${NAME} screens found"
	else
		for pid in $screens; do
			echo "Stopping screen session $pid"
			screen -S $pid -X quit
		done
	fi
        
}

function scrollLog() {
	[ -f ${LOGS_DIR}${NAME}-last-1.log ] && cp ${LOGS_DIR}${NAME}-last-1.log  ${LOGS_DIR}${NAME}-last-2.log
	[ -f ${LOGS_DIR}${NAME}-last-0.log ] && cp ${LOGS_DIR}${NAME}-last-0.log  ${LOGS_DIR}${NAME}-last-1.log 
	[ -f ${LOGS_DIR}${NAME}.log ] && cp ${LOGS_DIR}${NAME}.log ${LOGS_DIR}${NAME}-last-0.log
	
	cat /dev/null > ${LOGS_DIR}${NAME}.log
}

function lastLog() {
	if [[ -z $1 ]]; then
		less -R +G -f ${LOGS_DIR}${NAME}-last-0.log
	else
		less -R +G -f ${LOGS_DIR}${NAME}-last-${1}.log
	fi
}
		
function curLog() {
	less -R +G -f ${LOGS_DIR}${NAME}.log
}

function log() {
	case $1 in
	last)
		lastLog $2
	;;
	cur)
		curLog 
	;;
	*)
		tail -f ${LOGS_DIR}${NAME}.log
	;;
	esac
}

function update() {
	stop
	cd $EXEC_DIR
  git config core.fileMode false
	git pull
	setChMod
	start
}

function help() {
	bname=`basename $0`
	echo -e "Usage: ${CYAN}$bname start|stop|restart|help${NOCOLOR}"
}

function setup() {

  if [ "$EUID" -ne 0 ]
    then echo "Please run as root"
    exit
  fi

	echo "Start the installation"
	echo ""

	echo "installing required npm packages ..."
	npm install
	echo "installing required npm packages DONE"

	echo ""
	echo "setting the execute right for scripts ..."
	setChMod
	echo "setting the execute right for scripts DONE"

	echo ""
	echo "copy config files..."
	cp /honeyserver/server/config.json.tmpl /honeyserver/server/config.json
	echo "copy config files DONE"

	echo ""
	echo "Installation DONE"
}

function init() {

	echo "Start the initialization"
	echo ""
  setChMod
  sh ./init.sh

	echo ""
	echo "initialization END"
}

function setChMod() {
	chmod 755 server.sh
	chmod 755 start.sh
	chmod 755 init.sh
}

setVars $@

case $1 in
	monitor|m)
		monitor 
	;;
	start)
		start 
	;;
	stop)
		stop
	;;
	restart)
		stop 
		sleep 1
		start 
	;;
	log)
		shift
		shift
		log $@
	;;
	loop)
		loop
	;;
	update)
		update
	;;
	help)
		help
	;;
	setup)
		setup
	;;
	init)
		init
	;;
	chmod)
		setChMod
	;;
	*)
		monitor
	;;
esac
