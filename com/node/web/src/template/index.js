import './base.css';

// move the content node into pageContent
const pageContent = document.getElementById('pageContent');
const content = document.getElementById('content');
if (content instanceof HTMLElement) {
  pageContent.appendChild(content);
}
