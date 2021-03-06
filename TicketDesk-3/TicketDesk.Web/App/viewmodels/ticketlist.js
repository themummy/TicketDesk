﻿define(['services/datacontext', 'plugins/router', 'services/logger'],
    function (datacontext, router, logger) {
        var tickets = ko.observableArray();
        var currentPage = ko.observable();
        var currentPageIndex = function () {
            return currentPage() - 1;
        };
        var isPaging = false;
        var togglePaging = function () {
            isPaging ^= 1;
        };
        var monitorBackgroundChanges = false;

        var toggleBackgroundChanges = function () {
            monitorBackgroundChanges ^= 1;
        };

        var activate = function () {
            ko.bindingHandlers.ticketChanged = {
                update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var value = valueAccessor();
                    var actual = ko.utils.unwrapObservable(value);
                    if ($(element).attr('data-listenforchanges') === 'true') {
                        logger.log("ticketChanged", null, null, false);
                        var p = $(element).fadeTo(50, 0.3).fadeTo(450, 1);;
                        if (bindingContext.$data.ticketStatus() != 'Closed') {
                        } else {
                            p.css({ 'background-color': 'rgba(200,200,200,0.8)' });
                        }
                    }
                }
            };
            datacontext.backgroudTicketRefreshCounter.subscribe(ticketCountChanged);
            currentPage(1);
            logger.log('Ticket List View Activated', null, 'TicketList', false);
            return datacontext.getOpenTicketPagedList(tickets, currentPageIndex())
                .finally(toggleBackgroundChanges);
        };

        var showTicketElement = function (element) {
            if (element.nodeType === 1 && !isPaging) {
                $(element).hide().fadeIn(500);
            }
        };
        var hideTicketElement = function (element) {
            if (element.nodeType === 1) {
                if (isPaging) {
                    $(element).remove();
                } else {
                    $(element).fadeOut(500, function() {
                        $(element).remove();

                    });
                }
            }
        };

        var ticketCountChanged = function () {
            if (monitorBackgroundChanges) {
                logger.log("ticketCountChanged", null, null, false);
                if (maxPage() < currentPage()) {
                    previous();
                } else {
                    toggleBackgroundChanges();
                    datacontext.getOpenTicketPagedList(tickets, currentPageIndex()).then(toggleBackgroundChanges);
                }
            }
        };

        var ticketItemsRendered = function (elements) {
            elements.forEach(function (elem) {
                if (elem.nodeName === 'ARTICLE') {
                    $(elem).attr('data-listenforchanges', 'true');
                }
            });
            var x = true;
        };

        var donePagingValues = {
            marginRight: 0,
            marginLeft: 0,
            opacity: 1
        };

        var offsetRightValues = {
            marginLeft: '40px',
            marginRight: '- 40px',
            opacity: 0,
            display: 'block'
        };

        var offsetLeftValues = {
            marginLeft: '-40px',
            marginRight: '40px',
            opacity: 0,
            display: 'block'
        };

        var maxPage = ko.computed(function () {
            return Math.ceil(datacontext.openTicketRowCount() / 5);
        });

        var canPrev = ko.computed(function () {
            return currentPage() > 1;
        });

        var canNext = ko.computed(function () {
            return currentPage() < maxPage();
        });

        var previous = function () {
            var elem = $('.view-list');
            if (canPrev()) {
                toggleBackgroundChanges();
                togglePaging();
                currentPage(currentPage() - 1);
                elem.css(donePagingValues);
                return Q.all([
                    $.when(elem.animate(offsetRightValues, 300, 'swing')),
                    datacontext.getOpenTicketPagedList(tickets, currentPageIndex())
                ]).then(pageIn);

                function pageIn() {
                    elem.css(offsetLeftValues);
                    elem.animate(donePagingValues, 300, 'swing');
                    toggleBackgroundChanges();
                    togglePaging();
                };
            }
            return Q.resolve();
        };

        var next = function (data, event) {
            var elem = $('.view-list');
            if (canNext()) {
                toggleBackgroundChanges();
                togglePaging();
                currentPage(currentPage() + 1);
                elem.css(donePagingValues);
                return Q.all([
                    $.when(elem.animate(offsetLeftValues, 200, 'swing')),
                     datacontext.getOpenTicketPagedList(tickets, currentPageIndex())
                ]).then(pageIn);

                function pageIn() {
                    elem.css(offsetRightValues);
                    elem.animate(donePagingValues, 200, 'swing');
                    toggleBackgroundChanges();
                    togglePaging();
                };
            }
            return Q.resolve();
        };

        var deactivate = function () {
            tickets([]);
        };

        var refresh = function () {
            toggleBackgroundChanges();
            return datacontext.getOpenTicketPagedList(tickets, currentPageIndex(), true)
                .then(toggleBackgroundChanges);
        };

        var gotoDetails = function (selectedTicket) {
            if (selectedTicket && selectedTicket.ticketId()) {
                var url = '#/ticket/' + selectedTicket.ticketId();
                router.navigate(url);
            }
        };

        var attached = function (view) {
            bindEventToList(view, '.ticket-brief', gotoDetails);
        };

        var bindEventToList = function (rootSelector, selector, callback, eventName) {
            var eName = eventName || 'click';
            $(rootSelector).on(eName, selector, function () {
                var session = ko.dataFor(this);
                callback(session);
                return false;
            });
        };




        var vm = {
            showTicketElement: showTicketElement,
            hideTicketElement: hideTicketElement,
            previous: previous,
            next: next,
            maxPage: maxPage,
            currentPage: currentPage,
            canPrev: canPrev,
            canNext: canNext,
            rowCount: datacontext.openTicketRowCount,
            activate: activate,
            deactivate: deactivate,
            refresh: refresh,
            tickets: tickets,
            title: $.i18n.t('appuitext:viewTicketListTitle'),//'Tickets',
            attached: attached,
            ticketItemsRendered: ticketItemsRendered
        };
        return vm;



    });