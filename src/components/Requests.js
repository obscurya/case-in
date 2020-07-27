import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

import RequestInfoFull from './RequestInfoFull';

import '../css/Requests.css';

class Requests extends Component {
  constructor(props) {
    super(props);

    this.state = {
      request: {
        _id: '',
        content: '',
        date: '',
        status: 'В рассмотрении',
        plan: '',
      },
      selectedRequest: {},
    };

    this.handleNewRequest = this.handleNewRequest.bind(this);
    this.appointRequest = this.appointRequest.bind(this);
    this.doneRequest = this.doneRequest.bind(this);
  }

  componentDidMount() {
    let autoRequest = this.props.autoRequest;

    if (Object.keys(autoRequest).length) {
      let date = new Date(autoRequest.date);
      let year = date.getFullYear();
      let month = ('0' + (date.getMonth() + 1)).slice(-2);
      let day = ('0' + date.getDate()).slice(-2);
      let hour = date.toLocaleTimeString(navigator.language, {
        hour: `2-digit`,
      });

      this.setState(
        {
          request: {
            ...autoRequest,
            date: `${day}.${month}.${year} ${hour}:00`,
          },
        },
        () => {
          this.props.removeAutoRequest();
        }
      );
    }
  }

  handleNewRequest(e) {
    let { name, value } = e.target;
    let request = {
      ...this.state.request,
      [name]: value,
    };

    this.setState({ request });
  }

  appointRequest(request, plan) {
    this.setState({ selectedRequest: {} }, () => {
      this.props.appointRequest(request, plan);
    });
  }

  doneRequest(request) {
    this.setState({ selectedRequest: {} }, () => {
      this.props.doneRequest(request);
    });
  }

  render() {
    let requests = this.props.requests;

    if (this.props.user.role === 'repairWorker') {
      requests = [];

      this.props.requests.forEach((request) => {
        if (request.status === 'Назначено') requests.push(request);
      });
    }

    return (
      <div className="main">
        <div className="main-left">
          <div className="requests-list">
            {this.props.user.role === 'productionManager' && (
              <div className="request-item cursor-default">
                <div className="request-item-title">
                  <textarea
                    name="content"
                    placeholder="Описание работ"
                    style={{ fontWeight: 'bold' }}
                    value={this.state.request.content}
                    onChange={this.handleNewRequest}
                  />
                </div>
                <div className="request-item-date-plan">
                  <input
                    name="date"
                    placeholder="Планируемая дата проведения работ"
                    value={this.state.request.date}
                    onChange={this.handleNewRequest}
                  />
                </div>
                <div className="request-item-status">
                  <button
                    className="button"
                    onClick={() => {
                      let request = {
                        ...this.state.request,
                      };

                      if (request.content === '' && request.date === '') return 0;

                      this.setState({ request: { content: '', date: '', status: 'В рассмотрении', plan: '' } }, () => {
                        this.props.sendRequest(request);
                      });
                    }}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <span>Отправить ремонтной службе</span>
                  </button>
                </div>
              </div>
            )}
            {requests.map((request, requestIndex) => (
              <div
                className="request-item"
                key={requestIndex}
                onClick={() => {
                  if (this.props.user.role === 'productionManager') return 0;

                  this.setState({ selectedRequest: request });
                }}
              >
                <div className="request-item-id">{requests.length - requestIndex}</div>
                <div className="request-item-title">{request.content}</div>
                <div className="request-item-date-plan">Запланированная дата работ: {request.date}</div>
                <div
                  className="request-item-status"
                  style={{ color: request.status === 'Назначено' ? '#FFB300' : request.status === 'Выполнено' ? '#388e3c' : '#999' }}
                >
                  {request.status}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="main-right">
          {this.props.user.role !== 'productionManager' && (
            <RequestInfoFull
              requests={requests}
              request={this.state.selectedRequest}
              user={this.props.user}
              appointRequest={this.appointRequest}
              doneRequest={this.doneRequest}
            />
          )}
        </div>
      </div>
    );
  }
}

export default Requests;
