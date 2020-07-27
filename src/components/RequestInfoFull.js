import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCog, faCheck } from '@fortawesome/free-solid-svg-icons';

import '../css/RequestInfoFull.css';

class RequestInfoFull extends Component {
  constructor(props) {
    super(props);

    this.state = {
      plan:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed et turpis nibh. Curabitur finibus nulla at neque euismod, sit amet tempus urna rhoncus. Sed ornare viverra libero placerat rutrum. In hac habitasse platea dictumst. Vestibulum finibus vel mi ac iaculis. Aliquam in semper nulla, nec ultrices augue. Nam at ornare mauris, vulputate elementum justo.\r\nFusce tristique in ante ac sodales. Maecenas ut felis enim. Fusce varius ornare enim, nec tincidunt dui rutrum non. Vivamus vitae felis elementum, vestibulum ipsum eget, vestibulum nunc. Nam iaculis magna ut ipsum maximus rutrum. Suspendisse potenti. Pellentesque fermentum molestie arcu, nec imperdiet lectus interdum a. Nunc mollis iaculis eros, at cursus ligula cursus at. Pellentesque a erat non mi accumsan tempus. Aliquam ut commodo justo. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In imperdiet auctor laoreet. Donec fringilla arcu ac ex sagittis tincidunt. Morbi urna eros, porta at convallis eu, tincidunt nec ipsum.',
    };

    this.handlePlan = this.handlePlan.bind(this);
  }

  handlePlan(e) {
    this.setState({ plan: e.target.value });
  }

  render() {
    if (!Object.keys(this.props.request).length) return <p style={{ padding: '30px' }}>Выберите заявку для отображения полной информации</p>;

    return (
      <div className="request-info-full">
        <div className="request-info-full-h">
          Информация о заявке №
          {this.props.requests.length -
            this.props.requests.findIndex((req) => {
              return req._id === this.props.request._id;
            })}
        </div>
        <div className="request-info-full-p" style={{ fontWeight: 'normal' }}>
          {this.props.request.content}
        </div>
        <div className="request-info-full-p" style={{ fontWeight: 'normal' }}>
          Запланированное время работ: {this.props.request.date}
        </div>
        {this.props.user.role === 'repairManager' && (
          <>
            <div className="request-info-full-p">Выбор ремонтных рабочих</div>
            <div className="request-info-full-persons">
              <div className="request-info-full-person">
                <FontAwesomeIcon icon={faUserCog} size="2x" color="#999" />
                <p>Ремонтный рабочий 1</p>
              </div>
            </div>
          </>
        )}
        <div className="request-info-full-p">План работ</div>
        {this.props.user.role === 'repairManager' ? (
          this.props.request.status !== 'Назначено' ? (
            <>
              <textarea value={this.state.plan} onChange={this.handlePlan}></textarea>
              <button className="button" onClick={() => this.props.appointRequest(this.props.request, this.state.plan)}>
                <FontAwesomeIcon icon={faCheck} />
                <span>Назначить</span>
              </button>
            </>
          ) : (
            <div className="request-info-full-p" style={{ fontWeight: 'normal', marginTop: '0' }}>
              {this.props.request.plan.map((planP, planPIndex) => (
                <p key={planPIndex}>{planP}</p>
              ))}
            </div>
          )
        ) : (
          <>
            <div className="request-info-full-p" style={{ fontWeight: 'normal', marginTop: '0' }}>
              {this.props.request.plan.map((planP, planPIndex) => (
                <p key={planPIndex}>{planP}</p>
              ))}
            </div>
            <button className="button" onClick={() => this.props.doneRequest(this.props.request)}>
              <FontAwesomeIcon icon={faCheck} />
              <span>Выполнено</span>
            </button>
          </>
        )}
      </div>
    );
  }
}

export default RequestInfoFull;
