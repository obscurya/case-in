import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie, faUserCog } from '@fortawesome/free-solid-svg-icons';

import '../css/Auth.css';

class Auth extends Component {
  render() {
    if (Object.keys(this.props.user).length) {
      return <Redirect to="/dashboard" />;
    }

    return (
      <div className="auth-window">
        <div className="auth-window-h">Авторизация. Выберите роль</div>
        <div className="auth-window-roles">
          <div className="auth-window-role" onClick={() => this.props.signIn(`productionForeman`)}>
            <div className="auth-window-role-photo">
              <FontAwesomeIcon icon={faUserTie} size={`5x`} color={`#666`} />
            </div>
            <div className="auth-window-role-title">Начальник цеха</div>
          </div>
          <div className="auth-window-role" onClick={() => this.props.signIn(`productionManager`)}>
            <div className="auth-window-role-photo">
              <FontAwesomeIcon icon={faUserTie} size={`5x`} color={`#999`} />
            </div>
            <div className="auth-window-role-title">Начальник участка</div>
          </div>
          <div className="auth-window-role" onClick={() => this.props.signIn(`repairManager`)}>
            <div className="auth-window-role-photo">
              <FontAwesomeIcon icon={faUserCog} size={`5x`} color={`#666`} />
            </div>
            <div className="auth-window-role-title">Начальник ремонтной службы</div>
          </div>
          <div className="auth-window-role" onClick={() => this.props.signIn(`repairWorker`)}>
            <div className="auth-window-role-photo">
              <FontAwesomeIcon icon={faUserCog} size={`5x`} color={`#999`} />
            </div>
            <div className="auth-window-role-title">Ремонтный рабочий</div>
          </div>
        </div>
      </div>
    );
  }
}

export default Auth;
